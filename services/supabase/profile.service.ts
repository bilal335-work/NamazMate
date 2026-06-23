import { supabase } from './client';

export interface ProfileUpdate {
  full_name?: string;
  gender?: string;
  avatar_type?: 'default_vector' | 'custom_upload';
  avatar_style?: string;
  avatar_key?: string;
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
    // Aladhan API Method IDs
    const methodIds: Record<string, number> = {
      'KARACHI': 1,
      'ISNA': 2,
      'MWL': 3,
      'UMM_AL_QURA': 4,
      'EGYPTIAN': 5,
      'AUTO': 7,
      'DUBAI': 16,
      'QATAR': 10,
      'KUWAIT': 9,
    };

    const aladhan_method_id = methodIds[settings.calculation_method] || 1;
    const aladhan_school_id = settings.asr_method === 'HANAFI' ? 1 : 0;

    const { data, error } = await supabase
      .from('prayer_settings')
      .upsert({
        user_id: userId,
        calculation_method: settings.calculation_method,
        aladhan_method_id,
        asr_method: settings.asr_method,
        aladhan_school_id,
        time_format: settings.time_format,
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
    before_prayer_minutes?: number;
    invite_notifications_enabled?: boolean;
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

  async getNotificationSettings(userId: string) {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getPrayerSettings(userId: string) {
    const { data, error } = await supabase
      .from('prayer_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getLocation(userId: string) {
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async savePushToken(userId: string, token: string, platform: 'ios' | 'android' | null, deviceId?: string) {
    const { data, error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        device_id: deviceId,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token'
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
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
