import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (Deno.env.get("ENABLE_DEV_TOOLS") !== "true") {
    return new Response(
      JSON.stringify({ success: false, error: 'Forbidden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    );
  }

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
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const { data: loc } = await supabase
      .from('user_locations')
      .select('timezone')
      .eq('user_id', user.id)
      .maybeSingle();

    const timezone = loc?.timezone || 'UTC';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now);

    if (action === 'reset_today') {
      const { error: deleteError } = await supabase
        .from('prayer_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('prayer_date', todayStr);

      if (deleteError) throw deleteError;

      const { data: syncRes, error: syncError } = await supabase.functions.invoke('sync-prayer-log-statuses', {
        headers: { 
          Authorization: authHeader,
          'x-client-time': req.headers.get('x-client-time') || ''
        }
      });

      if (syncError || !syncRes.success) {
        throw new Error(syncError?.message || 'Sync failed');
      }

      return new Response(
        JSON.stringify({ success: true, action, message: 'Today prayers reset.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'seed_week') {
      const logsToUpsert = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = formatter.format(date);
        
        let fajr_status = 'prayed';
        let dhuhr_status = 'prayed';
        let asr_status = 'prayed';
        let maghrib_status = 'prayed';
        let isha_status = 'prayed';
        
        if (i === 2) {
          fajr_status = 'not_completed';
        } else if (i === 4) {
          asr_status = 'not_completed';
          maghrib_status = 'not_completed';
        } else if (i === 6) {
          fajr_status = 'qaza_prayed';
        } else if (i === 7) {
          dhuhr_status = 'not_completed';
          isha_status = 'not_completed';
        }
        
        let daily_score = 0;
        if (fajr_status === 'prayed') daily_score += 1;
        else if (fajr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (dhuhr_status === 'prayed') daily_score += 1;
        else if (dhuhr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (asr_status === 'prayed') daily_score += 1;
        else if (asr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (maghrib_status === 'prayed') daily_score += 1;
        else if (maghrib_status === 'qaza_prayed') daily_score += 0.5;
        
        if (isha_status === 'prayed') daily_score += 1;
        else if (isha_status === 'qaza_prayed') daily_score += 0.5;

        const toTimestamp = (hour: number) => {
          const d = new Date(date);
          d.setUTCHours(hour, 0, 0, 0);
          return d.toISOString();
        };

        logsToUpsert.push({
          user_id: user.id,
          prayer_date: dateStr,
          fajr_status,
          dhuhr_status,
          asr_status,
          maghrib_status,
          isha_status,
          fajr_marked_at: fajr_status.endsWith('prayed') ? toTimestamp(5) : null,
          dhuhr_marked_at: dhuhr_status.endsWith('prayed') ? toTimestamp(12) : null,
          asr_marked_at: asr_status.endsWith('prayed') ? toTimestamp(15) : null,
          maghrib_marked_at: maghrib_status.endsWith('prayed') ? toTimestamp(18) : null,
          isha_marked_at: isha_status.endsWith('prayed') ? toTimestamp(20) : null,
          daily_score,
        });
      }

      const { error: upsertError } = await supabase
        .from('prayer_logs')
        .upsert(logsToUpsert, { onConflict: 'user_id, prayer_date' });

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({ success: true, action, message: 'Week data seeded.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'seed_partner') {
      const { data: activePair, error: activePairError } = await supabase
        .from('pairs')
        .select('*')
        .eq('status', 'active')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .maybeSingle();

      if (activePairError) throw activePairError;

      let partnerId = '';

      if (activePair) {
        partnerId = activePair.user_a_id === user.id ? activePair.user_b_id : activePair.user_a_id;
      } else {
        partnerId = crypto.randomUUID();
        const fakeEmail = `dev_partner_${partnerId.slice(0, 8)}@namazmate.local`;

        const { data: authUser, error: authUserError } = await supabase.auth.admin.createUser({
          id: partnerId,
          email: fakeEmail,
          email_confirm: true,
          user_metadata: { full_name: 'Dev Partner' }
        });

        if (authUserError) throw authUserError;

        partnerId = authUser.user.id;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', partnerId);
        if (profileError) throw profileError;

        const { error: pairError } = await supabase
          .from('pairs')
          .insert({
            user_a_id: user.id,
            user_b_id: partnerId,
            status: 'active',
            pair_start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        if (pairError) throw pairError;
      }

      const partnerLogs = [];
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = formatter.format(date);
        
        let fajr_status = 'prayed';
        let dhuhr_status = 'prayed';
        let asr_status = 'prayed';
        let maghrib_status = 'prayed';
        let isha_status = 'prayed';
        
        if (i === 1) {
          dhuhr_status = 'qaza_prayed';
        } else if (i === 2) {
          fajr_status = 'not_completed';
        } else if (i === 3) {
          maghrib_status = 'qaza_prayed';
        }
        
        let daily_score = 0;
        if (fajr_status === 'prayed') daily_score += 1;
        else if (fajr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (dhuhr_status === 'prayed') daily_score += 1;
        else if (dhuhr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (asr_status === 'prayed') daily_score += 1;
        else if (asr_status === 'qaza_prayed') daily_score += 0.5;
        
        if (maghrib_status === 'prayed') daily_score += 1;
        else if (maghrib_status === 'qaza_prayed') daily_score += 0.5;
        
        if (isha_status === 'prayed') daily_score += 1;
        else if (isha_status === 'qaza_prayed') daily_score += 0.5;

        partnerLogs.push({
          user_id: partnerId,
          prayer_date: dateStr,
          fajr_status,
          dhuhr_status,
          asr_status,
          maghrib_status,
          isha_status,
          daily_score,
        });
      }

      const { error: upsertPartnerError } = await supabase
        .from('prayer_logs')
        .upsert(partnerLogs, { onConflict: 'user_id, prayer_date' });

      if (upsertPartnerError) throw upsertPartnerError;

      return new Response(
        JSON.stringify({ success: true, action, message: 'Fake partner seeded.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'clear_all') {
      const { data: activePairs } = await supabase
        .from('pairs')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

      const partnerIds = activePairs ? activePairs.map(p => p.user_a_id === user.id ? p.user_b_id : p.user_a_id) : [];

      const idsToDeleteLogs = [user.id, ...partnerIds];
      const { error: logsError } = await supabase
        .from('prayer_logs')
        .delete()
        .in('user_id', idsToDeleteLogs);
      if (logsError) throw logsError;

      const { error: pairsError } = await supabase
        .from('pairs')
        .delete()
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);
      if (pairsError) throw pairsError;

      const { error: invitesError } = await supabase
        .from('pair_invites')
        .delete()
        .eq('created_by', user.id);
      if (invitesError) throw invitesError;

      const { data: devPartners } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', 'Dev Partner')
        .neq('id', user.id);

      if (devPartners && devPartners.length > 0) {
        for (const p of devPartners) {
          try {
            await supabase.auth.admin.deleteUser(p.id);
          } catch (e) {
            console.error(`Failed to delete auth user ${p.id}:`, e);
          }
        }
      }

      await supabase
        .from('profiles')
        .delete()
        .eq('full_name', 'Dev Partner')
        .neq('id', user.id);

      return new Response(
        JSON.stringify({ success: true, action, message: 'All data cleared.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in dev-seed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
