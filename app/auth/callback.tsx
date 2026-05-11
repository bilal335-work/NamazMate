import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase/client';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the URL that opened the app
      const url = await Linking.getInitialURL();
      
      if (url) {
        const { queryParams } = Linking.parse(url);
        const { access_token, refresh_token } = queryParams as any;

        if (access_token && refresh_token) {
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

      // If no tokens or error, check if we already have a session
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
