import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/services/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { ensureClientSession, ensureFreshSession } from '@/features/auth/services/auth.service';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
  hasLocation: boolean;
  hasSettings: boolean;
  isFullySetup: boolean;
  gender: string | null;
}

interface AuthStore extends AuthState {
  setAuthState: (state: Partial<AuthState>) => void;
  resetAuthState: () => void;
  fetchProfile: (session: Session) => Promise<void>;
}

let profileFetchRequestId = 0;
let profileFetchInFlight = false;
let profileFetchCooldownUntil = 0;

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

const isMissingOrInvalidSessionError = (message: string) => (
  message.includes('Invalid Refresh Token') ||
  message.includes('No authenticated Supabase session') ||
  message.includes('Authenticated profile is missing') ||
  message.includes('permission denied for table profiles')
);

const resetState = {
  session: null,
  user: null,
  loading: false,
  onboardingCompleted: false,
  gender: null,
  hasLocation: false,
  hasSettings: false,
  isFullySetup: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  loading: true,
  onboardingCompleted: false,
  hasLocation: false,
  hasSettings: false,
  isFullySetup: false,
  gender: null,

  setAuthState: (newState) => set((state) => {
    const nextState = { ...state, ...newState };
    nextState.isFullySetup = !!nextState.onboardingCompleted && nextState.hasLocation && nextState.hasSettings;
    return nextState;
  }),

  resetAuthState: () => {
    profileFetchRequestId++;
    set(resetState);
  },

  fetchProfile: async (session) => {
    let freshSession = session;
    try {
      const activeSession = await ensureClientSession(session);

      if (!activeSession?.access_token || activeSession.user.id !== session.user.id) {
        throw new Error('No authenticated Supabase session is available for this profile request.');
      }

      freshSession = activeSession;

      const [profileRes, locationRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('onboarding_completed, gender').eq('id', freshSession.user.id).maybeSingle(),
        supabase.from('user_locations').select('city, country_code, latitude, longitude, timezone').eq('user_id', freshSession.user.id).maybeSingle(),
        supabase.from('prayer_settings').select('aladhan_method_id, aladhan_school_id, calculation_method, asr_method').eq('user_id', freshSession.user.id).maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (locationRes.error) throw locationRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (!profileRes.data) {
        throw new Error('Authenticated profile is missing for the current Supabase session.');
      }

      const loc = locationRes.data;
      const setObj = settingsRes.data;

      const hasValidLocation = !!(loc && loc.city && loc.country_code && loc.latitude != null && loc.longitude != null && loc.timezone);
      const hasValidSettings = !!(setObj && setObj.aladhan_method_id != null && setObj.aladhan_school_id != null && setObj.calculation_method && setObj.asr_method);

      set({
        session: freshSession,
        user: freshSession.user,
        loading: false,
        onboardingCompleted: !!profileRes.data?.onboarding_completed,
        gender: profileRes.data?.gender || null,
        hasLocation: hasValidLocation,
        hasSettings: hasValidSettings,
        isFullySetup: !!profileRes.data?.onboarding_completed && hasValidLocation && hasValidSettings,
      });
    } catch (e) {
      const message = getErrorMessage(e);
      console.error('[useAuthStore] fetchProfile error:', e);

      if (isMissingOrInvalidSessionError(message)) {
        await supabase.auth.signOut({ scope: 'local' });
        useAuthStore.getState().resetAuthState();
        return;
      }

      if (message.includes('Request rate limit')) {
        profileFetchCooldownUntil = Date.now() + 60_000;
      }

      set({
        session: freshSession,
        user: freshSession.user,
        loading: false,
        onboardingCompleted: false,
        gender: null,
        hasLocation: false,
        hasSettings: false,
        isFullySetup: false,
      });
    }
  }
}));

// Initialize global auth state listener once at the module level
let initialized = false;

const scheduleProfileFetch = (session: Session) => {
  const requestId = ++profileFetchRequestId;

  setTimeout(async () => {
    if (requestId !== profileFetchRequestId) return;
    if (profileFetchInFlight) return;
    if (Date.now() < profileFetchCooldownUntil) return;

    profileFetchInFlight = true;
    try {
      await useAuthStore.getState().fetchProfile(session);
    } finally {
      profileFetchInFlight = false;
    }
  }, 0);
};

export const hydrateAuthSession = async (session: Session) => {
  useAuthStore.getState().setAuthState({
    session,
    user: session.user,
    loading: true,
  });

  await useAuthStore.getState().fetchProfile(session);
};

const initGlobalAuthListener = () => {
  if (initialized) return;
  initialized = true;

  // Initial check
  ensureFreshSession().then((session) => {
    if (session) {
      scheduleProfileFetch(session);
    } else {
      useAuthStore.getState().resetAuthState();
    }
  });

  // Listen for auth state changes.
  // Keep this callback synchronous: Supabase can deadlock if this handler awaits
  // another Supabase call while it is still processing an auth event.
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      useAuthStore.getState().setAuthState({
        session,
        user: session.user,
      });

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        useAuthStore.getState().setAuthState({ loading: true });
        scheduleProfileFetch(session);
      }
    } else {
      useAuthStore.getState().resetAuthState();
    }
  });
};

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    initGlobalAuthListener();
  }, []);

  return {
    session: store.session,
    user: store.user,
    loading: store.loading,
    onboardingCompleted: store.onboardingCompleted,
    gender: store.gender,
    hasLocation: store.hasLocation,
    hasSettings: store.hasSettings,
    isFullySetup: store.isFullySetup,
    clearAuthState: store.resetAuthState,
    refreshProfile: async () => {
      const currentSession = useAuthStore.getState().session;
      if (currentSession) {
        await useAuthStore.getState().fetchProfile(currentSession);
      }
    }
  };
};
