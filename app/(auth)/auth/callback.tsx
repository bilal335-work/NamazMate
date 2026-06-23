import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { access_token, refresh_token, type } = params;

        if (typeof access_token === 'string' && typeof refresh_token === 'string') {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error) {
            if (type === 'recovery') {
              router.replace('/(auth)/reset-password');
            } else {
              router.replace('/');
            }
            return;
          }
        }
        
        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/');
        } else {
          router.replace('/(auth)/sign-in');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/(auth)/sign-in');
      }
    };

    handleCallback();
  }, [params, router]);

  return null;
}
