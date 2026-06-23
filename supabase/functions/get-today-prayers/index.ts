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

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: loc.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStr = formatter.format(now);

    const { data: cached } = await supabase
      .from('prayer_time_cache')
      .select('*')
      .eq('user_id', user.id)
      .eq('prayer_date', todayStr)
      .eq('aladhan_method_id', set.aladhan_method_id)
      .eq('aladhan_school_id', set.aladhan_school_id)
      .gte('latitude', loc.latitude - 0.01)
      .lte('latitude', loc.latitude + 0.01)
      .gte('longitude', loc.longitude - 0.01)
      .lte('longitude', loc.longitude + 0.01)
      .maybeSingle();

    if (cached && cached.sunrise) {
      return new Response(
        JSON.stringify({ success: true, data: cached }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const [year, month, day] = todayStr.split('-');
    const aladhanUrl = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${loc.latitude}&longitude=${loc.longitude}&method=${set.aladhan_method_id}&school=${set.aladhan_school_id}`;
    
    const aladhanRes = await fetch(aladhanUrl);
    const aladhanData = await aladhanRes.json();
    const timings = aladhanData.data.timings;
    
    // Calculate offset string manually
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

    const toIso = (time: string) => `${todayStr}T${time}:00${offsetStr}`;

    const normalized = {
      user_id: user.id,
      prayer_date: todayStr,
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

    const { data: saved } = await supabase
      .from('prayer_time_cache')
      .insert(normalized)
      .select()
      .single();

    return new Response(
      JSON.stringify({ success: true, data: saved || normalized }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
