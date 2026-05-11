import { useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationService } from '@/services/notifications/notification.service';
import { profileService } from '@/services/supabase/profile.service';
import { prayerService } from '@/services/prayer/prayer.service';
import { locationService } from '@/services/location/location.service';
import { PrayerKey } from '@/types/prayer';

export const useSchedulePrayerNotifications = () => {
  const { user } = useAuth();

  const scheduleAll = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Cancel all existing notifications first to avoid duplicates
      await notificationService.cancelAllNotifications();

      // 2. Fetch notification settings
      const settings = await profileService.getNotificationSettings(user.id);
      if (!settings || (!settings.prayer_reminders_enabled && !settings.before_prayer_reminder_enabled && !settings.qaza_reminder_enabled)) {
        return;
      }

      // 3. Fetch user location for timezone
      const location = await locationService.getUserLocation(user.id);
      if (!location) return;

      // 4. Get prayer times for the next 7 days
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const endDate = nextWeek.toISOString().split('T')[0];

      // Ensure month is cached
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      await prayerService.getMonthPrayers(currentMonth, currentYear);
      
      // If it's the end of the month, also cache next month
      if (today.getDate() > 24) {
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(today.getMonth() + 1);
        await prayerService.getMonthPrayers(nextMonthDate.getMonth() + 1, nextMonthDate.getFullYear());
      }

      const prayers = await prayerService.getPrayerTimeRange(user.id, startDate, endDate);
      if (!prayers || prayers.length === 0) return;

      const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

      for (const day of prayers) {
        for (const key of prayerKeys) {
          const prayerTime = new Date(day[key]);
          const prayerName = key.charAt(0).toUpperCase() + key.slice(1);

          // 1. Prayer Time Notification
          if (settings.prayer_reminders_enabled) {
            await notificationService.schedulePrayerNotification(
              `${day.prayer_date}_${key}`,
              `${prayerName} Prayer`,
              `It's time for ${prayerName} prayer.`,
              prayerTime,
              { type: 'prayer_time', prayerKey: key, date: day.prayer_date }
            );
          }

          // 2. Before Prayer Notification
          if (settings.before_prayer_reminder_enabled) {
            const beforeTime = new Date(prayerTime.getTime() - (settings.before_prayer_minutes || 10) * 60000);
            if (beforeTime.getTime() > Date.now()) {
              await notificationService.schedulePrayerNotification(
                `${day.prayer_date}_${key}_before`,
                `${prayerName} Reminder`,
                `${prayerName} prayer is in ${settings.before_prayer_minutes || 10} minutes.`,
                beforeTime,
                { type: 'before_prayer', prayerKey: key, date: day.prayer_date }
              );
            }
          }

          // 3. Qaza Available Notification
          // This fires when the NEXT prayer starts (or for Isha, when the day ends/midnight)
          if (settings.qaza_reminder_enabled) {
             const nextIndex = prayerKeys.indexOf(key) + 1;
             let qazaTime: Date | null = null;
             
             if (nextIndex < prayerKeys.length) {
               qazaTime = new Date(day[prayerKeys[nextIndex]]);
             } else {
               // For Isha, use midnight of next day or end of Isha
               // For simplicity, let's use Isha + 1 hour or fixed 23:59
               qazaTime = new Date(day.isha);
               qazaTime.setHours(qazaTime.getHours() + 1);
             }

             if (qazaTime && qazaTime.getTime() > Date.now()) {
                await notificationService.schedulePrayerNotification(
                  `${day.prayer_date}_${key}_qaza`,
                  `Qaza Reminder`,
                  `Did you pray ${prayerName}? It is now in Qaza.`,
                  qazaTime,
                  { type: 'qaza_available', prayerKey: key, date: day.prayer_date }
                );
             }
          }
        }
      }
    } catch (e) {
      console.error('Error in scheduleAll:', e);
    }
  }, [user]);

  return { scheduleAll };
};
