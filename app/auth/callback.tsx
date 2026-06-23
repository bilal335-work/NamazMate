import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL that opened the app
        const url = await Linking.getInitialURL();

        if (url) {
          const parsed = Linking.parse(url);
          const { access_token, refresh_token } = parsed.queryParams || {};

          if (typeof access_token === 'string' && typeof refresh_token === 'string') {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (!error) {
              router.replace('/');
              return;
            }
          }
        }
      } catch (err) {
        // Log error if needed or handle it
        console.error('Auth callback error:', err);
      }

      // Fallback: check if we already have a session or redirect to sign-in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      } else {
        router.replace('/(auth)/sign-in');
      }
    };

    handleCallback();
  }, [router]);

  return null;
}

