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

    if (isServiceRole && req.headers.get('X-Debug-User-ID')) {
      const debugUserId = req.headers.get('X-Debug-User-ID');
      const { data: userData } = await supabase.auth.admin.getUserById(debugUserId);
      user = userData?.user;
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED' } }),
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
      supabase.from('user_locations').select('latitude, longitude, timezone, city, country_code').eq('user_id', user.id).maybeSingle(),
      supabase.from('prayer_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const loc = locationRes.data;
    const set = settingsRes.data;

    if (!loc || !set) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'LOCATION_OR_SETTINGS_MISSING' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data: existing } = await supabase
      .from('prayer_time_cache')
      .select('prayer_date, sunrise')
      .eq('user_id', user.id)
      .eq('aladhan_method_id', set.aladhan_method_id)
      .eq('aladhan_school_id', set.aladhan_school_id)
      .gte('latitude', loc.latitude - 0.01)
      .lte('latitude', loc.latitude + 0.01)
      .gte('longitude', loc.longitude - 0.01)
      .lte('longitude', loc.longitude + 0.01)
      .gte('prayer_date', startDate)
      .lte('prayer_date', endDate);

    if (existing && existing.length >= 28 && existing.every(e => e.sunrise)) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already cached.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const tune = `${set.fajr_adjustment || 0},0,${set.dhuhr_adjustment || 0},${set.asr_adjustment || 0},${set.maghrib_adjustment || 0},0,${set.isha_adjustment || 0},0,0`;
    const aladhanUrl = `https://api.aladhan.com/v1/calendar?latitude=${loc.latitude}&longitude=${loc.longitude}&method=${set.aladhan_method_id}&school=${set.aladhan_school_id}&month=${month}&year=${year}&tune=${tune}`;
    
    const aladhanRes = await fetch(aladhanUrl);
    const aladhanData = await aladhanRes.json();
    
    // Calculate offset string manually
    const now = new Date();
    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: loc.timezone,
      timeZoneName: 'longOffset'
    }).formatToParts(now);
    const offsetVal = offsetParts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00';
    let offsetStr = '+00:00';
    const match = offsetVal.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      const minutes = match[3] || '00';
      offsetStr = `${sign}${hours}:${minutes}`;
    }

    const cacheEntries = aladhanData.data.map((day: any) => {
      const d = new Date(day.date.timestamp * 1000);
      const isoDate = d.toISOString().split('T')[0];
      const timings = day.timings;
      const toIso = (time: string) => `${isoDate}T${time.split(' ')[0]}:00${offsetStr}`;

      return {
        user_id: user.id,
        prayer_date: isoDate,
        fajr: toIso(timings.Fajr),
        sunrise: toIso(timings.Sunrise),
        dhuhr: toIso(timings.Dhuhr),
        asr: toIso(timings.Asr),
        maghrib: toIso(timings.Maghrib),
        isha: toIso(timings.Isha),
        timezone: loc.timezone,
        latitude: loc.latitude,
        longitude: loc.longitude,
        calculation_method: set.calculation_method,
        aladhan_method_id: set.aladhan_method_id,
        asr_method: set.asr_method,
        aladhan_school_id: set.aladhan_school_id,
      };
    });

    const { error: upsertError } = await supabase
      .from('prayer_time_cache')
      .upsert(cacheEntries, { onConflict: 'user_id,prayer_date' });

    if (upsertError) console.error('Upsert error:', upsertError);

    return new Response(
      JSON.stringify({ success: true, count: cacheEntries.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in get-month-prayers:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
