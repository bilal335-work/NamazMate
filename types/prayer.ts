export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus = 
  | 'locked' 
  | 'available' 
  | 'prayed' 
  | 'qaza_available' 
  | 'qaza_prayed' 
  | 'not_completed';

export interface TodayPrayerTimes {
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  timezone: string;
}

export interface PrayerTimeCache {
  id: string;
  user_id: string;
  prayer_date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  timezone: string;
  latitude: number;
  longitude: number;
  calculation_method: string;
  aladhan_method_id: number;
  asr_method: string;
  aladhan_school_id: number;
}

export interface PrayerLog {
  id: string;
  user_id: string;
  prayer_date: string;
  fajr_status: PrayerStatus;
  dhuhr_status: PrayerStatus;
  asr_status: PrayerStatus;
  maghrib_status: PrayerStatus;
  isha_status: PrayerStatus;
  fajr_marked_at?: string | null;
  dhuhr_marked_at?: string | null;
  asr_marked_at?: string | null;
  maghrib_marked_at?: string | null;
  isha_marked_at?: string | null;
  daily_score: number;
  created_at: string;
  updated_at: string;
}
