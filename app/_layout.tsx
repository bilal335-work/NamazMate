import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppOpeningAnimation } from '@/components/animation/AppOpeningAnimation';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
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

  return <RootLayoutNav />;
}

// Global flag to track cold open across hot reloads if needed, 
// though useState(true) is usually enough for production.
let isColdOpen = true;

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, user, loading, onboardingCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(isColdOpen);

  useEffect(() => {
    if (loading || showAnimation) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const isVerifyEmail = segments.includes('verify-email');

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
    } else if (!onboardingCompleted) {
      // Verified but onboarding not complete
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      // Authenticated, verified, and onboarding complete
      if (inAuthGroup || isVerifyEmail || inOnboarding) {
        router.replace('/(tabs)');
      }
    }
  }, [session, user, loading, onboardingCompleted, segments, router, showAnimation]);

  const handleAnimationComplete = () => {
    isColdOpen = false;
    setShowAnimation(false);
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      
      {showAnimation && (
        <AppOpeningAnimation onComplete={handleAnimationComplete} />
      )}
    </ThemeProvider>
  );
}
