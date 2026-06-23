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

    const { prayer_key } = await req.json();
    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayer_key)) {
      throw new Error('Invalid prayer key');
    }

    // 1. Sync current statuses first to ensure we have the latest
    const { data: syncRes, error: syncError } = await supabase.functions.invoke('sync-prayer-log-statuses', {
      headers: { Authorization: authHeader }
    });

    if (syncError || !syncRes.success) {
      throw new Error(syncError?.message || 'Sync failed');
    }

    const currentLog = syncRes.data;
    const statusKey = `${prayer_key}_status`;
    const currentStatus = currentLog[statusKey];

    // 2. Validate transition
    let newStatus = '';
    if (currentStatus === 'available') {
      newStatus = 'prayed';
    } else if (currentStatus === 'qaza_available') {
      newStatus = 'qaza_prayed';
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Cannot mark prayer. Current status is ${currentStatus}.` 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

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
