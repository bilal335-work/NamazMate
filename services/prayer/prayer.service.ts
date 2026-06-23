import { supabase } from '../supabase/client';
import { TodayPrayerTimes } from '@/types/prayer';

export const prayerService = {
  async getTodayPrayers(): Promise<TodayPrayerTimes | null> {
    const { data, error } = await supabase.functions.invoke('get-today-prayers');

    if (error || !data?.success) {
      console.warn('[PrayerService] getTodayPrayers failed:', error || data?.error);
      return null;
    }

    return data.data;
  },

  async getMonthPrayers(month: number, year: number) {
    const { data, error } = await supabase.functions.invoke('get-month-prayers', {
      body: { month, year }
    });

    if (error || !data?.success) {
      console.error('[PrayerService] getMonthPrayers failed:', error || data?.error, { month, year });
      return null;
    }

    return data.data;
  },

  async getPrayerTimeRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('prayer_time_cache')
      .select('*')
      .eq('user_id', userId)
      .gte('prayer_date', startDate)
      .lte('prayer_date', endDate)
      .order('prayer_date', { ascending: true });

    if (error) {
      console.error('Error fetching prayer time range:', error);
      return [];
    }

    return data;
  }
};
