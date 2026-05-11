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
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const { inviteId } = await req.json();
    if (!inviteId) {
      return new Response(JSON.stringify({ success: false, error: 'Invite ID is required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const { data: invite, error: inviteError } = await supabase
      .from('pair_invites')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', inviteId)
      .eq('created_by', user.id) // ONLY the creator can cancel
      .eq('status', 'pending')
      .select()
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ success: false, error: 'Invite not found, not pending, or not yours to cancel.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: invite }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in cancel-pair-invite:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
