import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';

export default function CompletionStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const resetStore = useOnboardingStore((state) => state.reset);
  
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (user) {
        await profileService.updateProfile(user.id, {
          onboarding_completed: true,
          onboarding_step: null
        });
        
        resetStore();
        // The RootLayout will automatically pick up the change in useAuth 
        // and redirect to (tabs) if everything is set up correctly.
        // But we can also manually replace to be safe.
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="All set!"
      subtitle="Your NamazMate journey begins now. May Allah accept your prayers."
    >
      <View style={styles.content}>
        <Animated.View style={[styles.illustration, { transform: [{ scale: scaleAnim }] }]}>
          <CheckCircle2 size={120} color={colors.primary} strokeWidth={1.5} />
        </Animated.View>
        
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryText, { color: colors.text + '80' }]}>
            We&apos;ve configured your prayer times and notification preferences. You can always change these in your profile settings.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton 
          title="Start Journey" 
          onPress={handleFinish} 
          loading={loading}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    marginBottom: 40,
  },
  summaryBox: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
  },
});
