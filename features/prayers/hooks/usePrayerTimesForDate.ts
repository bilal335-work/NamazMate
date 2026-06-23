import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/features/prayers/services/prayer.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TodayPrayerTimes } from '@/features/prayers/types';

export const usePrayerTimesForDate = (date: string, enabled = true) => {
  const { session, user, isFullySetup } = useAuth();

  return useQuery<TodayPrayerTimes | null>({
    queryKey: ['prayerTimes', user?.id, date],
    queryFn: async () => {
      if (!user?.id) return null;

      // 1. Try local database cache first
      const cached = await prayerService.getPrayerTimeRange(user.id, date, date);
      if (cached && cached.length > 0) {
        return cached[0] as unknown as TodayPrayerTimes;
      }

      // 2. If no cache row exists for this date, trigger get-month-prayers to populate cache
      const [yearStr, monthStr] = date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      await prayerService.getMonthPrayers(month, year);

      // 3. Re-query the cache
      const reCheck = await prayerService.getPrayerTimeRange(user.id, date, date);
      if (reCheck && reCheck.length > 0) {
        return reCheck[0] as unknown as TodayPrayerTimes;
      }

      return null;
    },
    staleTime: Infinity, // Past prayer times never change
    enabled: !!session?.access_token && !!user?.id && isFullySetup && enabled,
  });
};
