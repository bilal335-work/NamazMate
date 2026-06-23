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

    const { inviteId } = await req.json();
    if (!inviteId) {
      return new Response(JSON.stringify({ success: false, error: 'Invite ID is required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const { data: invite, error: inviteError } = await supabase
      .from('pair_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ success: false, error: 'Invite not found or not pending.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    const receiverId = (invite as { receiver_id?: string | null }).receiver_id;

    if (!receiverId || receiverId !== user.id) {
      return new Response(JSON.stringify({ success: false, error: 'Only the intended receiver can decline this invite.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    const { data: declinedInvite, error: updateError } = await supabase
      .from('pair_invites')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', inviteId)
      .eq('status', 'pending')
      .select()
      .single();

    if (updateError || !declinedInvite) {
      return new Response(JSON.stringify({ success: false, error: 'Invite not found or not pending.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: declinedInvite }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in decline-pair-invite:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
