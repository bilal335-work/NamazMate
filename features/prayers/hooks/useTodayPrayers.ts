import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/features/prayers/services/prayer.service';
import { TodayPrayerTimes } from '@/features/prayers/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useTodayPrayers = () => {
  const { session, user, isFullySetup } = useAuth();
  
  return useQuery<TodayPrayerTimes | null>({
    queryKey: ['todayPrayers', user?.id],
    queryFn: () => prayerService.getTodayPrayers(),
    staleTime: 1000 * 60 * 60, // 1 hour cache on client
    retry: 2,
    enabled: !!session && !!user && isFullySetup,
  });
};
