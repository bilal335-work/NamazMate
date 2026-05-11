import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duoService } from '@/services/duo/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useRemovePartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (pairId: string) => duoService.removePartner(pairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-pair', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pair-invites', user?.id] });
    },
  });
}
