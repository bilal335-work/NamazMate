import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/services/prayer/prayer.service';
import { TodayPrayerTimes } from '@/types/prayer';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useTodayPrayers = () => {
  const { session, user, onboardingCompleted } = useAuth();
  
  return useQuery<TodayPrayerTimes | null>({
    queryKey: ['todayPrayers'],
    queryFn: () => prayerService.getTodayPrayers(),
    staleTime: 1000 * 60 * 60, // 1 hour cache on client
    retry: 2,
    enabled: !!session && !!user && !!onboardingCompleted,
  });
};
