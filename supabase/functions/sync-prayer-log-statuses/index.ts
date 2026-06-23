import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization') || '';
    const apiKeyHeader = req.headers.get('apikey') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const debugUserId = req.headers.get('X-Debug-User-ID');
    
    const incomingKey = authHeader.replace('Bearer ', '') || apiKeyHeader;
    
    let user;
    let isServiceRole = false;

    if (incomingKey === serviceRoleKey) {
      isServiceRole = true;
    } else {
      const { data: { user: authUser }, error: aError } = await supabase.auth.getUser(incomingKey);
      if (aError?.message?.includes('missing sub claim')) {
        isServiceRole = true;
      } else {
        user = authUser;
      }
    }

    if (isServiceRole && debugUserId) {
      const { data: userData } = await supabase.auth.admin.getUserById(debugUserId);
      user = userData?.user;
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 1. Get today's prayer times
    // Pass along the auth/debug headers to the downstream function
    const invokeHeaders: Record<string, string> = { Authorization: authHeader };
    if (apiKeyHeader) invokeHeaders['apikey'] = apiKeyHeader;
    if (isServiceRole && debugUserId) invokeHeaders['X-Debug-User-ID'] = debugUserId;

    const { data: prayerTimesRes, error: prayerError } = await supabase.functions.invoke('get-today-prayers', {
      headers: invokeHeaders
    });

    if (prayerError || !prayerTimesRes || !prayerTimesRes.success) {
      throw new Error(prayerError?.message || prayerTimesRes?.error?.message || 'Failed to fetch prayer times');
    }

    const timings = prayerTimesRes.data;
    const { timezone, prayer_date: todayStr } = timings;

    // 2. Get current time in user's timezone (optionally using x-client-time header for clock-drift / testing)
    const clientTimeHeader = req.headers.get('x-client-time');
    let now = new Date();
    if (clientTimeHeader) {
      const parsed = new Date(clientTimeHeader);
      if (!isNaN(parsed.getTime())) {
        now = parsed;
      }
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    const userTodayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    const userNow = now;

    // 3. Cleanup: Finalize old logs
    // Prayers from previous days become 'not_completed' once their window is fully closed.
    // Fajr-Maghrib of yesterday are closed at midnight.
    // Isha of yesterday is closed at today's Fajr.
    const finalStatuses = ['prayed', 'qaza_prayed', 'not_completed'];
    const todayFajr = new Date(timings.fajr);
    
    let cleanupQuery = supabase
      .from('prayer_logs')
      .update({
        fajr_status: 'not_completed',
        dhuhr_status: 'not_completed',
        asr_status: 'not_completed',
        maghrib_status: 'not_completed',
        isha_status: 'not_completed',
      })
      .eq('user_id', user.id)
      .or(`fajr_status.not.in.(${finalStatuses}),dhuhr_status.not.in.(${finalStatuses}),asr_status.not.in.(${finalStatuses}),maghrib_status.not.in.(${finalStatuses}),isha_status.not.in.(${finalStatuses})`);

    if (userNow < todayFajr) {
      // If before Fajr, only cleanup logs older than yesterday
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayParts = formatter.formatToParts(yesterdayDate);
      const getYPart = (type: string) => yesterdayParts.find(p => p.type === type)?.value;
      const yesterdayStr = `${getYPart('year')}-${getYPart('month')}-${getYPart('day')}`;
      
      cleanupQuery = cleanupQuery.lt('prayer_date', yesterdayStr);
    } else {
      // If after Fajr, cleanup everything before today
      cleanupQuery = cleanupQuery.lt('prayer_date', userTodayStr);
    }

    const { error: cleanupError } = await cleanupQuery;
    if (cleanupError) console.error('Cleanup error:', cleanupError);

    // 4. Fetch or Create Today's Log
    const { data: existingLog, error: logFetchError } = await supabase
      .from('prayer_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('prayer_date', todayStr)
      .maybeSingle();

    if (logFetchError) throw logFetchError;

    const currentLog = existingLog || {
      user_id: user.id,
      prayer_date: todayStr,
      fajr_status: 'locked',
      dhuhr_status: 'locked',
      asr_status: 'locked',
      maghrib_status: 'locked',
      isha_status: 'locked',
      daily_score: 0,
    };

    // 5. Recalculate Statuses
    const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const updatedLog: Record<string, any> = { ...currentLog };
    let score = 0;

    for (let i = 0; i < prayerKeys.length; i++) {
      const key = prayerKeys[i];
      const statusKey = `${key}_status`;
      const currentStatus = currentLog[statusKey];
      
      if (currentStatus === 'prayed') {
        score += 1;
        continue;
      }
      if (currentStatus === 'qaza_prayed') {
        score += 0.5;
        continue;
      }
      if (currentStatus === 'not_completed') continue;

      const prayerTime = new Date(timings[key]);
      let windowEndTime: Date;

      if (key === 'fajr') {
        windowEndTime = new Date(timings.sunrise);
      } else if (key === 'dhuhr') {
        windowEndTime = new Date(timings.asr);
      } else if (key === 'asr') {
        windowEndTime = new Date(timings.maghrib);
      } else if (key === 'maghrib') {
        windowEndTime = new Date(timings.isha);
      } else {
        // Isha special rule: active until next day's Fajr
        // First try to fetch from cache for the next day
        let nextDayFajr: Date | null = null;
        try {
          const todayDate = new Date(timings.prayer_date);
          const nextDayDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
          const nextDayStr = nextDayDate.toISOString().split('T')[0];
          
          const { data: nextCache } = await supabase
            .from('prayer_time_cache')
            .select('fajr')
            .eq('user_id', user.id)
            .eq('prayer_date', nextDayStr)
            .eq('aladhan_method_id', timings.aladhan_method_id || 1)
            .eq('aladhan_school_id', timings.aladhan_school_id || 1)
            .maybeSingle();
            
          if (nextCache?.fajr) {
            nextDayFajr = new Date(nextCache.fajr);
          }
        } catch (err) {
          console.error('Failed to fetch next day Fajr:', err);
        }
        
        windowEndTime = nextDayFajr || new Date(new Date(timings.fajr).getTime() + 24 * 60 * 60 * 1000);
      }

      let newStatus = 'locked';
      
      if (userNow >= prayerTime) {
        if (userNow < windowEndTime) {
          newStatus = 'available';
        } else {
          // Window has passed. 
          // Check if it's still the same calendar day (userTodayStr === currentLog.prayer_date)
          // Exception: Isha window ends AFTER midnight. 
          // Rule: "any remaining qaza_available prayers become not_completed when the prayer day ends"
          // Rule: "Do not allow old-day Qaza"
          
          if (userTodayStr === currentLog.prayer_date) {
            newStatus = 'qaza_available';
          } else {
            // It's a different calendar day.
            // For Isha, if we are before its window end, it's still "available" (handled above).
            // Once past window end OR once day changes (for non-Isha), it's not_completed.
            newStatus = 'not_completed';
          }
        }
      }
      
      updatedLog[statusKey] = newStatus;
    }

    updatedLog.daily_score = score;

    // 6. Save
    let hasChanged = !existingLog;
    if (existingLog) {
      const checkKeys = [
        'fajr_status', 'dhuhr_status', 'asr_status', 'maghrib_status', 'isha_status',
        'daily_score'
      ];
      for (const key of checkKeys) {
        if (updatedLog[key] !== existingLog[key]) {
          hasChanged = true;
          break;
        }
      }
    }

    let saved = existingLog;
    if (hasChanged) {
      const { data: upsertedData, error: saveError } = await supabase
        .from('prayer_logs')
        .upsert(updatedLog)
        .select()
        .single();

      if (saveError) throw saveError;
      saved = upsertedData;
    }

    return new Response(JSON.stringify({ success: true, data: saved }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in sync-prayer-log-statuses:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
