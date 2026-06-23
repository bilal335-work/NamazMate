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

    const { prayer_key, mark_type, date } = await req.json();
    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayer_key)) {
      throw new Error('Invalid prayer key');
    }

    let currentLog;

    if (date) {
      // 1. Fetch user's profile created_at and location timezone
      const [locRes, profileRes] = await Promise.all([
        supabase.from('user_locations').select('timezone').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('created_at').eq('id', user.id).maybeSingle()
      ]);

      const tz = locRes.data?.timezone || 'UTC';
      const createdAt = profileRes.data?.created_at;

      // 2. Format client date limit
      const clientTimeHeader = req.headers.get('x-client-time');
      let now = new Date();
      if (clientTimeHeader) {
        const parsed = new Date(clientTimeHeader);
        if (!isNaN(parsed.getTime())) {
          now = parsed;
        }
      }

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const userTodayStr = formatter.format(now);

      // Validate date ranges
      if (date > userTodayStr) {
        return new Response(JSON.stringify({ success: false, error: 'Cannot mark prayers for future dates.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      // Get earliest allowed date: min of signup date and earliest log
      const { data: earliestLogRow } = await supabase
        .from('prayer_logs')
        .select('prayer_date')
        .eq('user_id', user.id)
        .order('prayer_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      const signupFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const signupDate = createdAt
        ? signupFormatter.format(new Date(createdAt))
        : date;

      const earliestAllowed = earliestLogRow?.prayer_date
        ? (earliestLogRow.prayer_date < signupDate
            ? earliestLogRow.prayer_date
            : signupDate)
        : signupDate;

      if (date < earliestAllowed) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Cannot mark prayers before account history start.' 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      // Query database directly for matching row
      const { data: existingLog, error: fetchError } = await supabase
        .from('prayer_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('prayer_date', date)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existingLog) {
        return new Response(JSON.stringify({ success: false, error: 'No prayer log found for this date.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
      }

      currentLog = existingLog;
    } else {
      // 1. Sync current statuses first to ensure we have the latest today log
      const { data: syncRes, error: syncError } = await supabase.functions.invoke('sync-prayer-log-statuses', {
        headers: { 
          Authorization: authHeader,
          'x-client-time': req.headers.get('x-client-time') || ''
        }
      });

      if (syncError || !syncRes.success) {
        throw new Error(syncError?.message || 'Sync failed');
      }

      currentLog = syncRes.data;
    }

    const statusKey = `${prayer_key}_status`;
    const currentStatus = currentLog[statusKey];

    // 2. Validate transition (supporting idempotency and client clock-drift / transition times)
    let calculatedNewStatus = '';
    const enableDevTools = Deno.env.get("ENABLE_DEV_TOOLS") === "true";
    if (enableDevTools && ['prayed', 'qaza_prayed', 'not_completed'].includes(mark_type)) {
      calculatedNewStatus = mark_type;
    } else {
      if (date) {
        if (currentStatus === 'qaza_prayed') {
          // Idempotent success - already marked as qaza_prayed
          return new Response(JSON.stringify({ success: true, data: currentLog }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        } else if (currentStatus === 'not_completed') {
          calculatedNewStatus = 'qaza_prayed';
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Cannot mark prayer. Current status is ${currentStatus}.` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }
      } else {
        if (currentStatus === 'available') {
          calculatedNewStatus = 'prayed';
        } else if (currentStatus === 'qaza_available') {
          calculatedNewStatus = 'qaza_prayed';
        } else if (currentStatus === 'prayed' || currentStatus === 'qaza_prayed') {
          // Idempotent success - already marked
          return new Response(JSON.stringify({ success: true, data: currentLog }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Cannot mark prayer. Current status is ${currentStatus}.` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }
      }
    }

    const newStatus = calculatedNewStatus;

    // 3. Update log
    const updates: Record<string, string | number> = {
      [statusKey]: newStatus,
      [`${prayer_key}_marked_at`]: new Date().toISOString(),
    };

    // 4. Recalculate score
    const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let score = 0;
    for (const k of prayerKeys) {
      const sK = `${k}_status`;
      const s = k === prayer_key ? newStatus : currentLog[sK];
      if (s === 'prayed') score += 1;
      else if (s === 'qaza_prayed') score += 0.5;
    }
    updates.daily_score = score;

    const { data: saved, error: saveError } = await supabase
      .from('prayer_logs')
      .update(updates)
      .eq('id', currentLog.id)
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify({ success: true, data: saved }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in mark-prayer:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
