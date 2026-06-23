import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prayerLogService } from '@/features/prayers/services/prayer-log.service';
import { PrayerKey } from '@/features/prayers/types';
import { Alert } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useMarkPrayer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ prayerKey, markType, date }: { prayerKey: PrayerKey; markType?: string; date?: string }) => 
      prayerLogService.markPrayer(prayerKey, markType, date),
    onError: (error: Error) => {
      Alert.alert('Marking Failed', error.message);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prayerLog', user?.id] });
    },
  });
};
