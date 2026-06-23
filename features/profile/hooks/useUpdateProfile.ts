import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService, ProfileUpdate } from '@/services/supabase/profile.service';
import { useSchedulePrayerNotifications } from '@/features/notifications/hooks/useSchedulePrayerNotifications';

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scheduleAll } = useSchedulePrayerNotifications();

  const updateProfile = useMutation({
    mutationFn: (update: ProfileUpdate) => {
      if (!user) throw new Error('Auth required');
      return profileService.updateProfile(user.id, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updatePrayerSettings = useMutation({
    mutationFn: (settings: {
      calculation_method: string;
      asr_method: 'STANDARD' | 'HANAFI';
      time_format: '12h' | '24h';
    }) => {
      if (!user) throw new Error('Auth required');
      return profileService.savePrayerSettings(user.id, settings);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['prayer_settings', user?.id] });
      // Invalidate prayer time caches as settings changed
      await queryClient.invalidateQueries({ queryKey: ['todayPrayers'] });
      // Reschedule notifications with new calculation method
      await scheduleAll(true);
    },
  });

  const updateNotificationSettings = useMutation({
    mutationFn: (settings: {
      prayer_reminders_enabled: boolean;
      before_prayer_reminder_enabled: boolean;
      qaza_reminder_enabled: boolean;
      partner_activity_enabled: boolean;
      push_notifications_enabled: boolean;
      before_prayer_minutes?: number;
      invite_notifications_enabled?: boolean;
    }) => {
      if (!user) throw new Error('Auth required');
      return profileService.saveNotificationSettings(user.id, settings);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['notification_settings', user?.id] });
      // Reschedule notifications with new preferences
      await scheduleAll(true);
    },
  });

  return {
    updateProfile,
    updatePrayerSettings,
    updateNotificationSettings,
  };
};
