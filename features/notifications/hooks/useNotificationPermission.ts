import { useState } from 'react';
import { notificationService } from '@/services/notifications/notification.service';
import { profileService } from '@/services/supabase/profile.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useNotificationPermission = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const requestPermission = async (enableAll = true) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        // Save default settings if granted
        await profileService.saveNotificationSettings(user.id, {
          prayer_reminders_enabled: enableAll,
          before_prayer_reminder_enabled: enableAll,
          qaza_reminder_enabled: enableAll,
          partner_activity_enabled: enableAll,
          push_notifications_enabled: enableAll,
          before_prayer_minutes: 10,
          invite_notifications_enabled: enableAll,
        });

        // Register push token
        await notificationService.registerPushToken(user.id);
      } else {
        // If denied, we still save disabled settings
        await profileService.saveNotificationSettings(user.id, {
          prayer_reminders_enabled: false,
          before_prayer_reminder_enabled: false,
          qaza_reminder_enabled: false,
          partner_activity_enabled: false,
          push_notifications_enabled: false,
          before_prayer_minutes: 10,
          invite_notifications_enabled: false,
        });
      }

      return granted;
    } catch (e) {
      console.error('Error in requestPermission:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const skipNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await profileService.saveNotificationSettings(user.id, {
        prayer_reminders_enabled: false,
        before_prayer_reminder_enabled: false,
        qaza_reminder_enabled: false,
        partner_activity_enabled: false,
        push_notifications_enabled: false,
        before_prayer_minutes: 10,
        invite_notifications_enabled: false,
      });
    } catch (e) {
      console.error('Error in skipNotifications:', e);
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPermission,
    skipNotifications,
    loading
  };
};
