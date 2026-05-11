import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duoService } from '@/services/duo/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useCreatePairInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => duoService.createInvite(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pair-invites', user?.id] });
    },
  });
}
