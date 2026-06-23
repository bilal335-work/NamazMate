import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { 
  useFonts,
  TitanOne_400Regular 
} from '@expo-google-fonts/titan-one';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';
let GoogleSignin: any;
try {
  const GoogleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  
  if (GoogleSignin) {

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }
} catch (e) {
  // Gracefully handle missing native module (e.g. in Expo Go)
  console.warn('Google Sign-In native module not found. It will not work in this environment.');
}

import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppOpeningAnimation } from '@/components/animation/AppOpeningAnimation';
import Colors from '@/constants/Colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePrayerLog } from '@/features/prayers/hooks/usePrayerLog';
import { TransitionProvider } from '@/features/auth/context/TransitionContext';

// Create a client
const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    TitanOne_400Regular,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Global flag to track cold open across hot reloads if needed, 
// though useState(true) is usually enough for production.
let isColdOpen = true;

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, user, loading, isFullySetup } = useAuth();
  const { isSuccess: logSuccess } = usePrayerLog();
  
  const segments = useSegments();
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(isColdOpen);

  // Home data is ready when:
  // 1. Auth is not loading
  // 2. Either user is not logged in, setup is incomplete, or today's log is fetched
  const isDataReady = !loading && (!session || !isFullySetup || logSuccess);

  useEffect(() => {
    if (__DEV__ && isColdOpen) {
      console.log('[RootLayoutNav] Status:', { 
        loading, 
        hasSession: !!session, 
        isFullySetup, 
        logSuccess,
        isDataReady 
      });
    }
  }, [loading, session, isFullySetup, logSuccess, isDataReady]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const isVerifyEmail = (segments as string[]).includes('verify-email');

    if (!session) {
      // Not signed in
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (!user?.email_confirmed_at) {
      // Signed in but not verified
      if (!isVerifyEmail) {
        router.replace('/(auth)/verify-email');
      }
    } else if (!isFullySetup) {
      // Verified but setup/onboarding not complete
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      // Authenticated, verified, and fully setup
      if (inAuthGroup || isVerifyEmail || inOnboarding) {
        router.replace('/(tabs)');
      }
    }
  }, [session, user, loading, isFullySetup, segments, router, showAnimation]);

  const handleAnimationComplete = useCallback(() => {
    isColdOpen = false;
    setShowAnimation(false);
  }, []);

  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      text: Colors.light.text,
      primary: Colors.light.primary,
    },
  };

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      text: Colors.dark.text,
      primary: Colors.dark.primary,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f1ea' }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
        <TransitionProvider onNavigate={(path) => router.replace(path as any)}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#f4f1ea' },
              animation: 'none', // Disable default animations for staircase
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="calendar"
              options={{
                headerShown: false,
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          
          {showAnimation && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
              <AppOpeningAnimation 
                onComplete={handleAnimationComplete} 
                ready={isDataReady}
              />
            </View>
          )}
        </TransitionProvider>
      </ThemeProvider>
    </View>
  );
}
