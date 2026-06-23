import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/features/prayers/services/prayer.service';
import { TodayPrayerTimes } from '@/features/prayers/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useHomePrayerTimes = (displayNow: Date, timezone?: string) => {
  const { session, user, isFullySetup } = useAuth();

  // 1. Calculate displayDateStr in the user's timezone
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  let displayDateStr = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(displayNow);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    displayDateStr = `${y}-${m}-${d}`;
  } catch (e) {
    const y = displayNow.getFullYear();
    const m = String(displayNow.getMonth() + 1).padStart(2, '0');
    const d = String(displayNow.getDate()).padStart(2, '0');
    displayDateStr = `${y}-${m}-${d}`;
  }

  const isDev = __DEV__;
  const queryKey = isDev 
    ? ['homePrayerTimes', user?.id, displayDateStr]
    : ['todayPrayers', user?.id];

  return useQuery<TodayPrayerTimes | null>({
    queryKey,
    queryFn: async () => {
      if (!isDev) {
        return prayerService.getTodayPrayers();
      }

      if (!user?.id) return null;

      // 1. Check local database cache
      const cached = await prayerService.getPrayerTimeRange(user.id, displayDateStr, displayDateStr);
      if (cached && cached.length > 0) {
        return cached[0];
      }

      // 2. Fetch month prayers as fallback
      const dateObj = new Date(displayNow);
      let month = dateObj.getMonth() + 1;
      let year = dateObj.getFullYear();
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: 'numeric',
          month: 'numeric',
        });
        const parts = formatter.formatToParts(dateObj);
        const yVal = parts.find(p => p.type === 'year')?.value;
        const mVal = parts.find(p => p.type === 'month')?.value;
        if (yVal && mVal) {
          year = parseInt(yVal, 10);
          month = parseInt(mVal, 10);
        }
      } catch (e) {}

      await prayerService.getMonthPrayers(month, year);

      // 3. Recheck cache
      const reCheck = await prayerService.getPrayerTimeRange(user.id, displayDateStr, displayDateStr);
      if (reCheck && reCheck.length > 0) {
        return reCheck[0];
      }

      return null;
    },
    staleTime: 1000 * 60 * 60,
    retry: 2,
    enabled: !!session?.access_token && !!user?.id && isFullySetup && !!timezone,
  });
};
