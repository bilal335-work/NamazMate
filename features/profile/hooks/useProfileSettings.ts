import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import { locationService } from '@/services/location/location.service';
import { supabase } from '@/services/supabase/client';

export const useProfileSettings = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.getProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: location, isLoading: loadingLocation } = useQuery({
    queryKey: ['user_location', user?.id],
    queryFn: () => locationService.getUserLocation(user!.id),
    enabled: !!user?.id,
  });

  const { data: prayerSettings, isLoading: loadingPrayerSettings } = useQuery({
    queryKey: ['prayer_settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: notificationSettings, isLoading: loadingNotificationSettings } = useQuery({
    queryKey: ['notification_settings', user?.id],
    queryFn: () => profileService.getNotificationSettings(user!.id),
    enabled: !!user?.id,
  });

  const { data: activePair, isLoading: loadingPair } = useQuery({
    queryKey: ['active_pair', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pairs')
        .select('*')
        .eq('status', 'active')
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    profile,
    location,
    prayerSettings,
    notificationSettings,
    activePair,
    isLoading: loadingProfile || loadingLocation || loadingPrayerSettings || loadingNotificationSettings || loadingPair,
  };
};
