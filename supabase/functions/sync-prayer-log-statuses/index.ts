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

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // 1. Get today's prayer times (from cache or fetch)
    const { data: prayerTimesRes, error: prayerError } = await supabase.functions.invoke('get-today-prayers', {
      headers: { Authorization: authHeader }
    });

    if (prayerError || !prayerTimesRes.success) {
      throw new Error(prayerError?.message || 'Failed to fetch prayer times');
    }

    const timings = prayerTimesRes.data;
    const { timezone, prayer_date: todayStr } = timings;

    // 2. Get current time in user's timezone
    const now = new Date();
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
    
    // Format: YYYY-MM-DD, HH:mm:ss
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    const userTodayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    const userNowIso = `${userTodayStr}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
    const userNow = new Date(userNowIso);

    // 3. Cleanup: Finalize previous day logs if they exist and are not completed
    // All non-final statuses (locked, available, qaza_available) for past dates become 'not_completed'
    const finalStatuses = ['prayed', 'qaza_prayed', 'not_completed'];
    const { error: cleanupError } = await supabase
      .from('prayer_logs')
      .update({
        fajr_status: 'not_completed',
        dhuhr_status: 'not_completed',
        asr_status: 'not_completed',
        maghrib_status: 'not_completed',
        isha_status: 'not_completed',
      })
      .eq('user_id', user.id)
      .lt('prayer_date', userTodayStr)
      .or(`fajr_status.not.in.(${finalStatuses}),dhuhr_status.not.in.(${finalStatuses}),asr_status.not.in.(${finalStatuses}),maghrib_status.not.in.(${finalStatuses}),isha_status.not.in.(${finalStatuses})`);

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

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

    // 5. Recalculate Statuses (only for 'locked', 'available', 'qaza_available')
    const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const updatedLog: Record<string, any> = { ...currentLog };
    let score = 0;

    for (let i = 0; i < prayerKeys.length; i++) {
      const key = prayerKeys[i];
      const statusKey = `${key}_status`;
      const currentStatus = currentLog[statusKey];
      
      const prayerTime = new Date(timings[key]);
      const nextPrayerTime = i < prayerKeys.length - 1 ? new Date(timings[prayerKeys[i + 1]]) : null;

      // If already final, keep it and add to score
      if (currentStatus === 'prayed') {
        score += 1;
        continue;
      }
      if (currentStatus === 'qaza_prayed') {
        score += 0.5;
        continue;
      }
      if (currentStatus === 'not_completed') {
        continue;
      }

      // Logic:
      // - locked: current time < prayer time
      // - available: prayer time <= current time < next prayer time (or end of day)
      // - qaza_available: current time >= next prayer time (or isha time passed)
      
      let newStatus = 'locked';
      if (userNow >= prayerTime) {
        if (!nextPrayerTime || userNow < nextPrayerTime) {
          newStatus = 'available';
        } else {
          newStatus = 'qaza_available';
        }
      }

      updatedLog[statusKey] = newStatus;
    }

    updatedLog.daily_score = score;

    // 6. Save
    const { data: saved, error: saveError } = await supabase
      .from('prayer_logs')
      .upsert(updatedLog)
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify({ success: true, data: saved }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in sync-prayer-log-statuses:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
