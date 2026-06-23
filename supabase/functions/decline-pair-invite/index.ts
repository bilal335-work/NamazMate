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

    // We allow declining if we know the invite id. Wait, the frontend might not have an invite ID to decline if they just saw a code. 
    // Usually they decline it from the UI after someone sends them the code, but wait - the invite doesn't know who it was sent to until accepted.
    // Actually, "decline" isn't strictly necessary for code-based invites unless there's a direct invite system.
    // If they have the invite ID, they can decline it.
    
    const { data: invite, error: inviteError } = await supabase
      .from('pair_invites')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', inviteId)
      .eq('status', 'pending')
      .select()
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ success: false, error: 'Invite not found or not pending.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: invite }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in decline-pair-invite:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
