import { useQuery } from '@tanstack/react-query';
import { duoService } from '@/services/duo/duo.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function usePartnerProfile(partnerId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-profile', partnerId],
    queryFn: () => (partnerId ? duoService.getPartnerProfile(partnerId) : null),
    enabled: !!user && !!partnerId,
  });
}
