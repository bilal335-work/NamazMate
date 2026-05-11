export interface NotificationSettings {
  id: string;
  user_id: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  duo_reminders: boolean;
  daily_summary: boolean;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
}
