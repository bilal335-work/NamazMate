import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useDuoRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to pair changes
    const pairChannel = supabase
      .channel(`duo-pairs:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pairs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-pair', user.id] });
        }
      )
      .subscribe();

    // Subscribe to invite changes
    const inviteChannel = supabase
      .channel(`duo-invites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pair_invites',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pair-invites', user.id] });
          queryClient.invalidateQueries({ queryKey: ['active-pair', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pairChannel);
      supabase.removeChannel(inviteChannel);
    };
  }, [user, queryClient]);
}
