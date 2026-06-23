import { useQuery } from '@tanstack/react-query';
import { prayerLogService } from '@/features/prayers/services/prayer-log.service';
import { PrayerLog } from '@/features/prayers/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const usePrayerLog = (enabled = true) => {
  const { session, user, isFullySetup } = useAuth();

  return useQuery<PrayerLog | null>({
    queryKey: ['prayerLog', user?.id, new Date().toISOString().split('T')[0]],
    queryFn: () => prayerLogService.getTodayLog(),
    enabled: !!session?.access_token && !!user?.id && isFullySetup && enabled,
  });
};
