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

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Fetch location and settings
    const [locationRes, settingsRes] = await Promise.all([
      supabase.from('user_locations').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('prayer_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (!locationRes.data) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'LOCATION_MISSING', message: 'Please set your location first.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const location = locationRes.data;
    const settings = settingsRes.data || {
      calculation_method: 'KARACHI',
      aladhan_method_id: 1,
      asr_method: 'STANDARD',
      aladhan_school_id: 0,
    };

    // Calculate today's date in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: location.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now); // YYYY-MM-DD

    // Check cache
    const { data: cached } = await supabase
      .from('prayer_time_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('prayer_date', todayStr)
      .eq('aladhan_method_id', settings.aladhan_method_id)
      .eq('aladhan_school_id', settings.aladhan_school_id)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ success: true, data: cached }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Call Aladhan API
    // Format: http://api.aladhan.com/v1/timings/17-07-2007?latitude=51.508515&longitude=-0.1254872&method=2
    const [year, month, day] = todayStr.split('-');
    const aladhanDate = `${day}-${month}-${year}`;
    
    const aladhanUrl = `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${location.latitude}&longitude=${location.longitude}&method=${settings.aladhan_method_id}&school=${settings.aladhan_school_id}`;
    
    const aladhanRes = await fetch(aladhanUrl);
    if (!aladhanRes.ok) {
      throw new Error('Aladhan API failed');
    }

    const aladhanData = await aladhanRes.json();
    const timings = aladhanData.data.timings;

    // Helper to convert "HH:mm" to ISO string in user's timezone
    const toIso = (time: string) => {
      // time is HH:mm
      return `${todayStr}T${time}:00`;
    };

    const normalized = {
      user_id: user.id,
      prayer_date: todayStr,
      fajr: toIso(timings.Fajr),
      dhuhr: toIso(timings.Dhuhr),
      asr: toIso(timings.Asr),
      maghrib: toIso(timings.Maghrib),
      isha: toIso(timings.Isha),
      timezone: location.timezone,
      latitude: location.latitude,
      longitude: location.longitude,
      calculation_method: settings.calculation_method,
      aladhan_method_id: settings.aladhan_method_id,
      asr_method: settings.asr_method,
      aladhan_school_id: settings.aladhan_school_id,
    };

    // Save to cache
    const { data: saved, error: saveError } = await supabase
      .from('prayer_time_cache')
      .insert(normalized)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving cache:', saveError);
    }

    return new Response(
      JSON.stringify({ success: true, data: saved || normalized }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in get-today-prayers:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred.' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
