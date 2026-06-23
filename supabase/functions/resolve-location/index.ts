import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  latitude: number;
  longitude: number;
}

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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(incomingKey);
      if (authError?.message?.includes('missing sub claim')) {
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

    const { latitude, longitude } = await req.json() as RequestBody;

    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_INPUT', message: 'Latitude and longitude are required.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Round coordinates for caching (2 decimals ~1.1km precision)
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;

    // Check cache
    const { data: cached } = await supabase
      .from('resolved_locations_cache')
      .select('*')
      .eq('rounded_latitude', roundedLat)
      .eq('rounded_longitude', roundedLng)
      .maybeSingle();

    if (cached && cached.timezone && cached.timezone !== 'UTC') {
      return new Response(
        JSON.stringify({ success: true, data: { ...cached, latitude, longitude } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Call Nominatim (OpenStreetMap) for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NamazMate-EdgeFunction',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Nominatim API error');
    }

    const geoData = await response.json();

    if (!geoData || !geoData.address) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Could not resolve location.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const timezoneResponse = await fetch(
      `https://timezonefinder.michelleg.app/api/v1/timezone?lat=${latitude}&lon=${longitude}`
    );

    if (!timezoneResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'TIMEZONE_NOT_FOUND', message: 'Could not resolve timezone.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const timezoneData = await timezoneResponse.json();
    const timezone = typeof timezoneData?.timezone === 'string' ? timezoneData.timezone : '';

    if (!timezone) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'TIMEZONE_NOT_FOUND', message: 'Could not resolve timezone.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    // Normalize response
    const normalized = {
      city: geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || geoData.address.city_district || '',
      region: geoData.address.state || geoData.address.county || '',
      country: geoData.address.country || '',
      country_code: geoData.address.country_code?.toUpperCase() || '',
      timezone,
    };

    // Save to cache
    await supabase
      .from('resolved_locations_cache')
      .upsert({
        rounded_latitude: roundedLat,
        rounded_longitude: roundedLng,
        ...normalized
      }, { onConflict: 'rounded_latitude,rounded_longitude' });

    return new Response(
      JSON.stringify({ success: true, data: { ...normalized, latitude, longitude } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in resolve-location:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred.' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
