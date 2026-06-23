import { supabase } from '@/services/supabase/client';
import { 
  AuthResponse, 
  SignInWithPasswordCredentials, 
  SignUpWithPasswordCredentials,
  User,
  Session
} from '@supabase/supabase-js';

/**
 * Signs up a new user with email and password.
 * Supabase will send an activation link to the provided email.
 */
export const signUp = async (credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
  return await supabase.auth.signUp(credentials);
};

/**
 * Signs in an existing user with email and password.
 */
export const signIn = async (credentials: SignInWithPasswordCredentials): Promise<AuthResponse> => {
  return await supabase.auth.signInWithPassword(credentials);
};

/**
 * Signs out the current user.
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  return await supabase.auth.signOut();
};

/**
 * Sends another verification email for a pending signup.
 */
export const resendVerification = async (email: string): Promise<{ error: Error | null }> => {
  return await supabase.auth.resend({
    type: 'signup',
    email,
  });
};

/**
 * Sends a password reset email.
 */
export const resetPassword = async (
  email: string,
  redirectTo = 'namazmate://reset-password'
): Promise<{ error: Error | null }> => {
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

/**
 * Gets the current cached Supabase session.
 * Supabase's auth client owns token refresh rotation; callers should not
 * manually refresh here because concurrent refreshes can reuse a rotated token.
 */
export const getSession = async (): Promise<{
  data: { session: Session | null };
  error: Error | null;
}> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { data: { session }, error: null };
  } catch (err: any) {
    return { data: { session: null }, error: err };
  }
};

/**
 * Returns the current session if one is available.
 */
export const ensureFreshSession = async (): Promise<Session | null> => {
  const { data } = await getSession();
  return data.session;
};

let cachedSession: Session | null = null;

// Synchronously update the cached session when auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

// Initial hydration
getSession().then(({ data }) => {
  if (data.session) {
    cachedSession = data.session;
  }
});

/**
 * Ensures the Supabase client has an active session before protected REST calls.
 * This only restores from a known session when getSession() is empty.
 */
export const ensureClientSession = async (fallbackSession?: Session | null): Promise<Session | null> => {
  if (cachedSession?.access_token) {
    return cachedSession;
  }

  const currentSession = await ensureFreshSession();
  if (currentSession?.access_token) {
    cachedSession = currentSession;
    return currentSession;
  }

  return fallbackSession || null;
};


/**
 * Gets the current user.
 */
export const getUser = async (): Promise<{
  data: { user: User | null };
  error: Error | null;
}> => {
  return await supabase.auth.getUser();
};

let GoogleSignin: any;
try {
  const GoogleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSigninModule.GoogleSignin;
} catch {
  // Native module not available
}

/**
 * Signs in with Google using native SDK.
 */
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    if (!GoogleSignin?.signIn) {
      throw new Error('Google Sign-In is not supported in this environment (e.g. Expo Go). Please use a Development Build.');
    }
    await GoogleSignin.hasPlayServices();
    
    // Clear any cached native Google session to force a fresh ID token fetch.
    // This is crucial if the user manual-time-travels, which causes the native cache to serve expired tokens.
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if not already signed in natively
    }

    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken || userInfo.idToken;
    
    if (idToken) {
      return await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
    } else {
      throw new Error('No ID token found');
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.code === '12500' || error.message?.includes('DEVELOPER_ERROR')) {
      console.warn('DEVELOPER_ERROR detected. Common causes:');
      console.warn('1. SHA-1 fingerprint mismatch in Google Cloud Console.');
      console.warn('2. Using Android Client ID instead of Web Client ID in configure().');
      console.warn('3. Package name mismatch in app.json vs Google Cloud.');
    }
    return { data: { user: null, session: null }, error: error as any };
  }
};

/**
 * Updates the current user's password.
 */
export const updatePassword = async (password: string): Promise<any> => {
  return await supabase.auth.updateUser({ password });
};
