import { supabase } from '@/services/supabase/client';
import { PrayerLog, PrayerKey } from '@/features/prayers/types';

export const prayerLogService = {
  async syncTodayLog(): Promise<PrayerLog | null> {
    const { data, error } = await supabase.functions.invoke('sync-prayer-log-statuses', {
      headers: {
        'x-client-time': new Date().toISOString(),
      },
    });

    if (error || !data?.success) {
      // Suppress console.error if it's an expected Missing Setup or Unauthenticated state
      return null;
    }

    return data.data;
  },

  async markPrayer(prayerKey: PrayerKey, markType?: string, date?: string): Promise<PrayerLog | null> {
    const { data, error } = await supabase.functions.invoke('mark-prayer', {
      body: { prayer_key: prayerKey, mark_type: markType || 'prayed', date },
      headers: {
        'x-client-time': new Date().toISOString(),
      },
    });

    if (error || !data.success) {
      console.error(`Error marking ${prayerKey}:`, error || data?.error);
      throw new Error(data?.error || 'Failed to mark prayer');
    }

    return data.data;
  },

  async getTodayLog(): Promise<PrayerLog | null> {
    // We usually want to sync before showing, but we can also just fetch from DB
    // However, syncing ensures the statuses are up to date with the current time
    return this.syncTodayLog();
  }
};
