import { supabase } from './client';
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
 * Gets the current session.
 */
export const getSession = async (): Promise<{
  data: { session: Session | null };
  error: Error | null;
}> => {
  return await supabase.auth.getSession();
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

/**
 * Signs in with Google.
 * Setup placeholder for MVP. 
 */
export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'namazmate://auth/callback',
    },
  });
};
