import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duoService } from '@/features/duo/services/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useAcceptPairInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (code: string) => duoService.acceptInvite(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-pair', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pair-invites', user?.id] });
    },
  });
}
