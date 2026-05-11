import { supabase } from './client';

export interface ProfileUpdate {
  full_name?: string;
  gender?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
  onboarding_step?: string | null;
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, update: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async savePrayerSettings(userId: string, settings: {
    calculation_method: string;
    asr_method: 'STANDARD' | 'HANAFI';
    time_format: '12h' | '24h';
  }) {
    const { data, error } = await supabase
      .from('prayer_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async saveNotificationSettings(userId: string, settings: {
    prayer_reminders_enabled: boolean;
    before_prayer_reminder_enabled: boolean;
    qaza_reminder_enabled: boolean;
    partner_activity_enabled: boolean;
    push_notifications_enabled: boolean;
  }) {
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async saveLocation(userId: string, location: {
    latitude: number;
    longitude: number;
    city: string;
    region?: string;
    country: string;
    country_code: string;
    timezone: string;
    location_source: 'gps' | 'city_selector' | 'manual' | 'map';
  }) {
    const { data, error } = await supabase
      .from('user_locations')
      .upsert({
        user_id: userId,
        ...location,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
