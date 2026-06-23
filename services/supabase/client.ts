import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isWeb = Platform.OS === 'web';

// Lazy load AsyncStorage only on native to avoid "NativeModule is null" on Web
let AsyncStorage: any = null;
if (!isWeb) {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // Fallback if not installed or fails to load
  }
}

const safeAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      }

      let secureValue: string | null = null;
      if (typeof SecureStore.getItemAsync === 'function') {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          secureValue = await SecureStore.getItemAsync(key);
        }
      }

      if (secureValue !== null) {
        return secureValue;
      }

      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      
      return null;
    } catch (error) {
      if (__DEV__) console.warn('[SupabaseStorage] getItem error', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return;
      }

      const isLarge = value.length > 2000;

      if (isLarge) {
        // Store in AsyncStorage to avoid 2048-byte limit in SecureStore
        if (AsyncStorage) {
          await AsyncStorage.setItem(key, value);
        }
        // Remove from SecureStore to avoid stale data
        if (typeof SecureStore.deleteItemAsync === 'function') {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            await SecureStore.deleteItemAsync(key);
          }
        }
      } else {
        // Store in SecureStore
        let storedSecurely = false;
        if (typeof SecureStore.setItemAsync === 'function') {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            await SecureStore.setItemAsync(key, value);
            storedSecurely = true;
          }
        }
        // Fallback to AsyncStorage if SecureStore is not available
        if (!storedSecurely && AsyncStorage) {
          await AsyncStorage.setItem(key, value);
        } else if (storedSecurely && AsyncStorage) {
          // Remove from AsyncStorage to avoid duplicate/stale data
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('[SupabaseStorage] setItem error', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }

      if (typeof SecureStore.deleteItemAsync === 'function') {
        const available = await SecureStore.isAvailableAsync();
        if (available) {
          await SecureStore.deleteItemAsync(key);
        }
      }

      if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      if (__DEV__) console.warn('[SupabaseStorage] removeItem error', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, options) => {
      const nextOptions = { ...options };
      if (nextOptions.headers) {
        if (nextOptions.headers instanceof Headers) {
          nextOptions.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          nextOptions.headers.set('Pragma', 'no-cache');
          nextOptions.headers.set('Expires', '0');
        } else if (Array.isArray(nextOptions.headers)) {
          nextOptions.headers = [
            ...nextOptions.headers,
            ['Cache-Control', 'no-cache, no-store, must-revalidate'],
            ['Pragma', 'no-cache'],
            ['Expires', '0']
          ];
        } else if (typeof nextOptions.headers === 'object') {
          nextOptions.headers = {
            ...nextOptions.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          };
        }
      } else {
        nextOptions.headers = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
      }
      return fetch(url, nextOptions);
    },
  },
});
