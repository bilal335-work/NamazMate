import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    onboardingCompleted: false,
  });

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session);
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchProfile(session);
      } else {
        setState({
          session: null,
          user: null,
          loading: false,
          onboardingCompleted: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (session: Session) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // If profile doesn't exist yet, it's fine (will be created during onboarding/trigger)
        setState({
          session,
          user: session.user,
          loading: false,
          onboardingCompleted: false,
        });
      } else {
        setState({
          session,
          user: session.user,
          loading: false,
          onboardingCompleted: !!data?.onboarding_completed,
        });
      }
    } catch (e) {
      setState({
        session,
        user: session.user,
        loading: false,
        onboardingCompleted: false,
      });
    }
  };

  return state;
};
