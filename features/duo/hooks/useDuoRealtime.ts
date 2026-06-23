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
        { event: '*', schema: 'public', table: 'pair_invites' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pair-invites', user.id] });
          queryClient.invalidateQueries({ queryKey: ['active-pair', user.id] });
        }
      )
      .subscribe();

    // Subscribe to prayer logs for real-time updates on partner progress
    const logsChannel = supabase
      .channel(`duo-logs:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['prayerLog'] });
          queryClient.invalidateQueries({ queryKey: ['partner-prayer-log'] });
          queryClient.invalidateQueries({ queryKey: ['duo-history'] });
        }
      )
      .subscribe();

    // Subscribe to reminders
    const reminderChannel = supabase
      .channel(`duo-reminders:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'partner_reminders', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          // Show local alert or notification for the reminder
          console.log('Received reminder:', payload.new);
          // In Phase 12 MVP, we just let the realtime update handle it or show a toast if available
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pairChannel);
      supabase.removeChannel(inviteChannel);
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(reminderChannel);
    };
  }, [user, queryClient]);
}
