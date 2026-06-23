/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "supabase";
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

    const { pairId, receiverId, prayerKey, message } = await req.json();

    if (!pairId || !receiverId || !prayerKey || !message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields or empty message.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (message.length > 120) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'MESSAGE_TOO_LONG', message: 'Reminder max 120 characters.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate pair and membership
    const { data: pair, error: pairError } = await supabase
      .from('pairs')
      .select('*')
      .eq('id', pairId)
      .eq('status', 'active')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .single();

    if (pairError || !pair) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Active pair not found.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Ensure receiver is the other person in the pair
    const partnerId = pair.user_a_id === user.id ? pair.user_b_id : pair.user_a_id;
    if (receiverId !== partnerId) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'INVALID_RECEIVER', message: 'Receiver must be your partner.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Cooldown check (30 minutes)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentReminders, error: cooldownError } = await supabase
      .from('partner_reminders')
      .select('id')
      .eq('pair_id', pairId)
      .eq('sender_id', user.id)
      .eq('receiver_id', receiverId)
      .eq('prayer_key', prayerKey)
      .gt('sent_at', thirtyMinsAgo)
      .limit(1);

    if (cooldownError) throw cooldownError;

    if (recentReminders && recentReminders.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: { code: 'COOLDOWN', message: 'Please wait 30 minutes before sending another reminder for this prayer.' } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Insert reminder
    const { data: reminder, error: insertError } = await supabase
      .from('partner_reminders')
      .insert({
        pair_id: pairId,
        sender_id: user.id,
        receiver_id: receiverId,
        prayer_key: prayerKey,
        message: message.trim()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // TODO: Trigger push notification via internal helper

    return new Response(
      JSON.stringify({ success: true, data: reminder }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-partner-reminder:', error);
    return new Response(
      JSON.stringify({ success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred.' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
