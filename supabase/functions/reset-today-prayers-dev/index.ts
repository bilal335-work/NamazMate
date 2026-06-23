import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Check if dev tools are enabled
    const enableDevTools = Deno.env.get("ENABLE_DEV_TOOLS") === "true";
    if (!enableDevTools) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Auth required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 3. Get today's date for this user
    const { data: prayerTimesRes, error: prayerError } = await supabase.functions.invoke('get-today-prayers', {
      headers: { Authorization: authHeader }
    });

    if (prayerError || !prayerTimesRes?.success) {
      throw new Error(prayerError?.message || 'Failed to get prayer times');
    }

    const todayStr = prayerTimesRes.data.prayer_date;

    // 4. Delete today's prayer log
    const { error: deleteError } = await supabase
      .from('prayer_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('prayer_date', todayStr);

    if (deleteError) throw deleteError;

    // 5. Sync statuses to recreate the log with correct initial states
    const { error: syncError } = await supabase.functions.invoke('sync-prayer-log-statuses', {
      headers: { Authorization: authHeader }
    });

    if (syncError) throw syncError;

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Today’s prayers reset." }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in reset-today-prayers-dev:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
