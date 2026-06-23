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
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Check for active pair
    const { data: existingPair } = await supabase
      .from('pairs')
      .select('id')
      .eq('status', 'active')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .maybeSingle();

    if (existingPair) {
      return new Response(JSON.stringify({ success: false, error: 'You already have an active partner.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Cancel existing pending invites by this user
    await supabase
      .from('pair_invites')
      .update({ status: 'cancelled' })
      .eq('created_by', user.id)
      .eq('status', 'pending');

    // Generate random 6 character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create new invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { data: invite, error: insertError } = await supabase
      .from('pair_invites')
      .insert({
        code,
        created_by: user.id,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, data: invite }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in create-pair-invite:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
