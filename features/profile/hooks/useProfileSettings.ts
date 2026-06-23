import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/services/supabase/client';

const firstRelated = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export const useProfileSettings = () => {
  const { user } = useAuth();

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['profile_settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_locations(*), prayer_settings(*), notification_settings(*)')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        profile: data,
        location: firstRelated(data?.user_locations),
        prayerSettings: firstRelated(data?.prayer_settings),
        notificationSettings: firstRelated(data?.notification_settings),
      };
    },
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
    profile: settings?.profile ?? null,
    location: settings?.location ?? null,
    prayerSettings: settings?.prayerSettings ?? null,
    notificationSettings: settings?.notificationSettings ?? null,
    activePair,
    isLoading: loadingSettings || loadingPair,
  };
};
