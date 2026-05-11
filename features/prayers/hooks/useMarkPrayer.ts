import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prayerLogService } from '@/services/prayer/prayer-log.service';
import { PrayerKey } from '@/types/prayer';
import { Alert } from 'react-native';

export const useMarkPrayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prayerKey: PrayerKey) => prayerLogService.markPrayer(prayerKey),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['prayerLog', data.prayer_date], data);
        queryClient.invalidateQueries({ queryKey: ['prayerLog'] });
      }
    },
    onError: (error: Error) => {
      Alert.alert('Marking Failed', error.message);
    },
  });
};
