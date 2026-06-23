import { useQuery } from '@tanstack/react-query';
import { duoService } from '@/features/duo/services/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useDuoHistory(partnerId?: string, pairStartDate?: string, days?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['duo-history', user?.id, partnerId, pairStartDate, days],
    queryFn: () => (user && partnerId && pairStartDate ? duoService.getDuoHistory(user.id, partnerId, pairStartDate, days) : null),
    enabled: !!user && !!partnerId && !!pairStartDate,
  });
}
