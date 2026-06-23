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

    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ success: false, error: 'Code is required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Find invite
    const { data: invite, error: inviteError } = await supabase
      .from('pair_invites')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired invite code.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    if (invite.created_by === user.id) {
      return new Response(JSON.stringify({ success: false, error: 'You cannot accept your own invite.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Check if either user has an active pair
    const { data: existingPairs } = await supabase
      .from('pairs')
      .select('id')
      .eq('status', 'active')
      .or(`user_a_id.in.(${user.id},${invite.created_by}),user_b_id.in.(${user.id},${invite.created_by})`);

    if (existingPairs && existingPairs.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'One of the users already has an active partner.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Start transaction-like process (we don't have true transactions in supabase-js for this, so we sequence it carefully)
    
    // 1. Update invite to accepted
    const { error: acceptError } = await supabase
      .from('pair_invites')
      .update({ 
        status: 'accepted',
        accepted_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invite.id)
      .eq('status', 'pending'); // optimistic concurrency

    if (acceptError) throw acceptError;

    // 2. Cancel all other pending invites for both users
    await supabase
      .from('pair_invites')
      .update({ status: 'cancelled' })
      .in('created_by', [user.id, invite.created_by])
      .eq('status', 'pending');

    // 3. Create the pair
    const { data: pair, error: pairError } = await supabase
      .from('pairs')
      .insert({
        user_a_id: invite.created_by,
        user_b_id: user.id,
        status: 'active',
        pair_start_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (pairError) {
      // Rollback invite (best effort)
      await supabase.from('pair_invites').update({ status: 'pending', accepted_by: null }).eq('id', invite.id);
      throw pairError;
    }

    // TODO: Send notification to inviter

    return new Response(JSON.stringify({ success: true, data: pair }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in accept-pair-invite:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
