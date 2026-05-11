import { useQuery } from '@tanstack/react-query';
import { prayerLogService } from '@/services/prayer/prayer-log.service';
import { PrayerLog } from '@/types/prayer';

export const usePrayerLog = () => {
  return useQuery<PrayerLog | null>({
    queryKey: ['prayerLog', new Date().toISOString().split('T')[0]],
    queryFn: () => prayerLogService.getTodayLog(),
  });
};
