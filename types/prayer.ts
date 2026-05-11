export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus = 
  | 'locked' 
  | 'available' 
  | 'prayed' 
  | 'qaza_available' 
  | 'qaza_prayed' 
  | 'not_completed';

export interface PrayerLog {
  id: string;
  user_id: string;
  prayer_date: string;
  prayer_name: PrayerName;
  status: PrayerStatus;
  marked_at: string | null;
  created_at: string;
}
