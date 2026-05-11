import { supabase } from '../supabase/client';
import { PrayerLog, PrayerKey } from '@/types/prayer';

export const prayerLogService = {
  async syncTodayLog(): Promise<PrayerLog | null> {
    const { data, error } = await supabase.functions.invoke('sync-prayer-log-statuses');

    if (error || !data.success) {
      console.error('Error syncing prayer log:', error || data?.error);
      return null;
    }

    return data.data;
  },

  async markPrayer(prayerKey: PrayerKey): Promise<PrayerLog | null> {
    const { data, error } = await supabase.functions.invoke('mark-prayer', {
      body: { prayer_key: prayerKey },
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
