import { useQuery } from '@tanstack/react-query';
import { duoService } from '@/features/duo/services/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function usePairInvites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pair-invites', user?.id],
    queryFn: () => (user ? duoService.getInvites(user.id) : null),
    enabled: !!user,
  });
}
