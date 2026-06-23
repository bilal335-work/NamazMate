export interface NotificationSettings {
  id: string;
  user_id: string;
  prayer_reminders_enabled: boolean;
  before_prayer_reminder_enabled: boolean;
  before_prayer_minutes: number;
  qaza_reminder_enabled: boolean;
  partner_activity_enabled: boolean;
  invite_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'prayer_time' | 'before_prayer' | 'qaza_available' | 'partner_activity' | 'invite';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_id: string | null;
  platform: 'ios' | 'android' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
