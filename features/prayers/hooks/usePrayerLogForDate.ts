import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PrayerLog } from '@/features/prayers/types';

export const usePrayerLogForDate = (date: string, enabled = true) => {
  const { session, user, isFullySetup } = useAuth();

  return useQuery<PrayerLog | null>({
    queryKey: ['prayerLog', user?.id, date],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('prayer_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('prayer_date', date);

      if (error) {
        console.error(`[usePrayerLogForDate] Error fetching log for ${date}:`, error);
        return null;
      }

      // Return the single log if found, otherwise null (safely, without throwing)
      return data && data.length > 0 ? data[0] : null;
    },
    staleTime: 30000, // 30 seconds stale time
    enabled: !!session?.access_token && !!user?.id && isFullySetup && enabled,
  });
};
