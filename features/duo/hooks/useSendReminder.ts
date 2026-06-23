import { useMutation } from '@tanstack/react-query';
import { duoService } from '@/features/duo/services/duo.service';

interface SendReminderParams {
  pairId: string;
  receiverId: string;
  prayerKey: string;
  message: string;
}

export function useSendReminder() {
  return useMutation({
    mutationFn: ({ pairId, receiverId, prayerKey, message }: SendReminderParams) => 
      duoService.sendReminder(pairId, receiverId, prayerKey, message),
  });
}
