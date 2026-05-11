import { useQuery } from '@tanstack/react-query';
import { duoService } from '@/services/duo/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function usePartnerPrayerLog(partnerId?: string, date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-prayer-log', partnerId, date],
    queryFn: () => (partnerId && date ? duoService.getPartnerTodayLog(partnerId, date) : null),
    enabled: !!user && !!partnerId && !!date,
  });
}
