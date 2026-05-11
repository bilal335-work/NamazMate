import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/supabase/profile.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => user ? profileService.getProfile(user.id) : null,
    enabled: !!user,
  });
};
