import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/services/prayer/prayer.service';
import { TodayPrayerTimes } from '@/types/prayer';

export const useTodayPrayers = () => {
  return useQuery<TodayPrayerTimes | null>({
    queryKey: ['todayPrayers'],
    queryFn: () => prayerService.getTodayPrayers(),
    staleTime: 1000 * 60 * 60, // 1 hour cache on client
    retry: 2,
  });
};
