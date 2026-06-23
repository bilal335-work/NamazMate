import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationService } from '@/features/notifications/services/notification.service';
import { profileService } from '@/features/profile/services/profile.service';
import { prayerService } from '@/features/prayers/services/prayer.service';
import { PrayerKey } from '@/features/prayers/types';
import { supabase } from '@/services/supabase/client';

const LAST_SCHEDULE_KEY = 'namazmate_last_notification_schedule';
let scheduleAllInFlight: Promise<void> | null = null;
let scheduleAllCooldownUntil = 0;
let lastScheduleStartedAt = 0;

const MIN_SCHEDULE_INTERVAL_MS = 10_000;
const SCHEDULE_COOLDOWN_MS = 60_000;

export const useSchedulePrayerNotifications = () => {
  const { session, user, onboardingCompleted } = useAuth();

  const scheduleAll = useCallback(async (force = false) => {
    if (!user || (!onboardingCompleted && !force)) return;
    if (scheduleAllInFlight) return scheduleAllInFlight;

    const now = Date.now();
    if (!force) {
      if (now < scheduleAllCooldownUntil) return;
      if (now < lastScheduleStartedAt + MIN_SCHEDULE_INTERVAL_MS) return;
    }

    lastScheduleStartedAt = now;

    scheduleAllInFlight = (async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession?.access_token) {
        if (__DEV__) {
          console.warn('[Notifications] Scheduling skipped: auth session not ready.');
        }
        return;
      }

      // 1. Fetch settings and location sequentially to prevent parallel token refreshes
      const settings = await profileService.getNotificationSettings(user.id);
      const location = await profileService.getLocation(user.id);

      if (!settings || !location) return;

      // 2. Check if we need to reschedule (unless forced)
      const todayStr = new Date().toISOString().split('T')[0];
      const settingsHash = JSON.stringify({
        pr: settings.prayer_reminders_enabled,
        bp: settings.before_prayer_reminder_enabled,
        bpm: settings.before_prayer_minutes,
        qr: settings.qaza_reminder_enabled,
        lat: Math.round(location.latitude * 100) / 100,
        lng: Math.round(location.longitude * 100) / 100,
        date: todayStr
      });

      if (!force) {
        const lastHash = await SecureStore.getItemAsync(LAST_SCHEDULE_KEY);
        if (lastHash === settingsHash) {
          // Already scheduled with these settings today
          return;
        }
      }

      // 3. If settings disabled, just cancel and return
      if (!settings.prayer_reminders_enabled && !settings.before_prayer_reminder_enabled && !settings.qaza_reminder_enabled) {
        await notificationService.cancelAllNotifications();
        await SecureStore.setItemAsync(LAST_SCHEDULE_KEY, settingsHash);
        return;
      }

      // 4. Get prayer times for the next 7 days
      const startDate = todayStr;
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const endDate = nextWeek.toISOString().split('T')[0];

      let prayers = await prayerService.getPrayerTimeRange(user.id, startDate, endDate);
      
      // 5. If data missing, fetch from edge functions
      if (!prayers || prayers.length < 7) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        await prayerService.getMonthPrayers(currentMonth, currentYear);
        
        // If it's the end of the month, also cache next month
        if (today.getDate() > 24) {
          const nextMonthDate = new Date();
          nextMonthDate.setMonth(today.getMonth() + 1);
          await prayerService.getMonthPrayers(nextMonthDate.getMonth() + 1, nextMonthDate.getFullYear());
        }
        
        // Refresh range
        prayers = await prayerService.getPrayerTimeRange(user.id, startDate, endDate);
      }

      if (!prayers || prayers.length === 0) return;

      // 6. Cancel and Reschedule
      await notificationService.cancelAllNotifications();

      const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

      for (const day of prayers) {
        for (const key of prayerKeys) {
          const prayerTime = new Date(day[key]);
          const prayerName = key.charAt(0).toUpperCase() + key.slice(1);

          // Skip if prayer time is in the past
          if (prayerTime.getTime() <= Date.now()) continue;

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
          if (settings.qaza_reminder_enabled) {
             const nextIndex = prayerKeys.indexOf(key) + 1;
             let qazaTime: Date | null = null;
             
             if (nextIndex < prayerKeys.length) {
               qazaTime = new Date(day[prayerKeys[nextIndex]]);
             } else {
               // For Isha, use Isha + 1 hour as Qaza reminder
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

      // 7. Store hash to prevent redundant scheduling
      await SecureStore.setItemAsync(LAST_SCHEDULE_KEY, settingsHash);
      scheduleAllCooldownUntil = Date.now() + SCHEDULE_COOLDOWN_MS;
    })().catch((e: any) => {
      const isNoSession = e?.message?.includes('No authenticated Supabase session') || String(e).includes('No authenticated Supabase session');
      const isRateLimit = e?.message?.includes('rate limit') || e?.status === 429 || String(e).includes('rate limit');
      
      if (isNoSession) {
        if (__DEV__) {
          console.warn('[Notifications] Scheduling skipped: auth session not ready.');
        }
        return;
      } else if (isRateLimit) {
        scheduleAllCooldownUntil = Date.now() + 60_000;
        console.warn('[Notifications] Scheduling skipped: auth rate limit. Will try later.');
      } else {
        scheduleAllCooldownUntil = Date.now() + 30_000;
        console.error('Error in scheduleAll:', e);
      }
    }).finally(() => {
      scheduleAllInFlight = null;
    });

    return scheduleAllInFlight;
  }, [session, user, onboardingCompleted]);

  return { scheduleAll };
};
