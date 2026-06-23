import { supabase } from '@/services/supabase/client';
import { TodayPrayerTimes } from '@/features/prayers/types';
import { ensureClientSession } from '@/features/auth/services/auth.service';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function debugInvokeFunction(name: string, body?: unknown) {
  try {
    const session = await ensureClientSession();
    const token = session?.access_token;

    if (!token) {
      return {
        success: false,
        error: 'AUTH_NOT_READY',
        status: 0,
      };
    }

    const url = `${SUPABASE_URL}/functions/v1/${name}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}



    return { success: res.ok && json?.success, data: json?.data, error: json?.error || text, status: res.status };
  } catch (err) {
    console.error(`[${name}] DEBUG FETCH CRASHED:`, err);
    return { success: false, error: String(err), status: 500 };
  }
}

export const prayerService = {
  async getTodayPrayers(): Promise<TodayPrayerTimes | null> {
    const result: any = __DEV__ 
      ? await debugInvokeFunction('get-today-prayers')
      : await supabase.functions.invoke('get-today-prayers');

    const data = __DEV__ ? result : result.data;
    const error = __DEV__ ? (result.success ? null : result.error) : result.error;

    if (error || !data?.success) {
      if (error === 'AUTH_NOT_READY') {
        return null;
      }
      if (__DEV__) {
        console.warn('[PrayerService] getTodayPrayers failed:', {
          status: result.status,
          error: result.error,
          dataError: data?.error
        });
      }
      return null;
    }

    return data.data;
  },

  async getMonthPrayers(month: number, year: number) {
    const result: any = __DEV__
      ? await debugInvokeFunction('get-month-prayers', { month, year })
      : await supabase.functions.invoke('get-month-prayers', { body: { month, year } });

    const data = __DEV__ ? result : result.data;
    const error = __DEV__ ? (result.success ? null : result.error) : result.error;

    if (error || !data?.success) {
      if (error === 'AUTH_NOT_READY') {
        return null;
      }
      console.error('[PrayerService] getMonthPrayers failed:', {
        status: result.status,
        error: result.error,
        dataError: data?.error,
        payload: { month, year }
      });
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
