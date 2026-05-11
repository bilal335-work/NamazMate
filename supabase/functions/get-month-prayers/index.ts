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
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { month, year } = await req.json();

    if (!month || !year) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_INPUT', message: 'Month and year are required.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const [locationRes, settingsRes] = await Promise.all([
      supabase.from('user_locations').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('prayer_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (!locationRes.data) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'LOCATION_MISSING', message: 'Location not set.' } }),
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

    // Check if we have many entries for this month already
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`; // Simplified

    const { data: existing } = await supabase
      .from('prayer_time_cache')
      .select('prayer_date')
      .eq('user_id', user.id)
      .eq('aladhan_method_id', settings.aladhan_method_id)
      .eq('aladhan_school_id', settings.aladhan_school_id)
      .gte('latitude', location.latitude - 0.01)
      .lte('latitude', location.latitude + 0.01)
      .gte('longitude', location.longitude - 0.01)
      .lte('longitude', location.longitude + 0.01)
      .gte('prayer_date', startDate)
      .lte('prayer_date', endDate);

    // If we have most days cached, just return success
    if (existing && existing.length >= 28) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already cached.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Apply adjustments if any
    const tune = `${settings.fajr_adjustment || 0},0,${settings.dhuhr_adjustment || 0},${settings.asr_adjustment || 0},${settings.maghrib_adjustment || 0},0,${settings.isha_adjustment || 0},0,0`;
    
    // Fetch month from Aladhan
    const aladhanUrl = `https://api.aladhan.com/v1/calendar?latitude=${location.latitude}&longitude=${location.longitude}&method=${settings.aladhan_method_id}&school=${settings.aladhan_school_id}&month=${month}&year=${year}&tune=${tune}`;
    
    const aladhanRes = await fetch(aladhanUrl);
    const aladhanData = await aladhanRes.json();
    
    const cacheEntries = aladhanData.data.map((day: any) => {
      const dateStr = day.date.readable;
      // Aladhan returns date as DD MMM YYYY
      // We need YYYY-MM-DD
      const d = new Date(day.date.timestamp * 1000);
      const isoDate = d.toISOString().split('T')[0];
      
      const timings = day.timings;
      const offset = day.meta.offset;
      const toIso = (time: string) => `${isoDate}T${time.split(' ')[0]}:00${offset}`;

      return {
        user_id: user.id,
        prayer_date: isoDate,
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
    });

    // Upsert into cache
    const { error: upsertError } = await supabase
      .from('prayer_time_cache')
      .upsert(cacheEntries, { onConflict: 'user_id,prayer_date,aladhan_method_id,aladhan_school_id' }); // Note: unique constraint might be needed

    if (upsertError) {
      console.error('Upsert error:', upsertError);
    }

    return new Response(
      JSON.stringify({ success: true, count: cacheEntries.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in get-month-prayers:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
