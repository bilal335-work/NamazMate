import { useQuery } from '@tanstack/react-query';
import { duoService } from '@/services/duo/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useActivePair() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-pair', user?.id],
    queryFn: () => (user ? duoService.getActivePair(user.id) : null),
    enabled: !!user,
  });
}
