import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/features/profile/services/profile.service';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useSchedulePrayerNotifications } from '@/features/notifications/hooks/useSchedulePrayerNotifications';

export default function CompletionStep() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { scheduleAll } = useSchedulePrayerNotifications();
  const resetStore = useOnboardingStore((state) => state.reset);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.timing(overlayFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  useEffect(() => {
    if (refreshProfile) {
      refreshProfile();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function playSuccessHaptic() {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, 90));
        if (cancelled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await new Promise(resolve => setTimeout(resolve, 120));
        if (cancelled) return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics should never break the flow
      }
    }

    playSuccessHaptic();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFinish = async () => {
    if (loading) return;
    setError(null);

    if (!user) {
      setError('Your session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    try {
      const [location, prayerSettings] = await Promise.all([
        profileService.getLocation(user.id),
        profileService.getPrayerSettings(user.id),
      ]);

      if (!location || !prayerSettings) {
        console.error('[Onboarding] Completion blocked: Missing data', {
          hasLocation: !!location,
          hasSettings: !!prayerSettings,
        });
        setError('Required setup data is missing. Please try going back and setting your location and prayer settings again.');
        setLoading(false);
        return;
      }

      await profileService.updateProfile(user.id, {
        onboarding_completed: true,
        onboarding_step: null
      });
      
      // Refresh auth state so RootLayout sees onboardingCompleted = true
      if (refreshProfile) {
        await refreshProfile();
      }

      // Reschedule notifications for the user since onboarding is now complete
      try {
        await scheduleAll(true);
      } catch (scheduleError) {
        console.error('Error scheduling notifications during onboarding completion:', scheduleError);
      }
      
      resetStore();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'An error occurred while saving your profile.');
      setLoading(false);
    }
  };

  return (
    <>
      <OnboardingLayout
        title="You're all set"
        subtitle="Your prayer settings are ready. You can update them anytime from Profile."
        footer={
          <View style={{ gap: 12 }}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <AppButton 
              title="Go to Home" 
              onPress={handleFinish} 
              loading={loading}
              icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
              iconPosition="right"
            />
          </View>
        }
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.successIconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.successBadge}>
              <Check size={48} color="#0f172a" strokeWidth={4} />
            </View>
          </Animated.View>
          
          <View style={styles.summaryContainer}>
            <Text style={styles.supportLine}>
              May Allah make it easy to stay consistent.
            </Text>
          </View>
        </Animated.View>
      </OnboardingLayout>

      {loading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: overlayFadeAnim }]}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Preparing your dashboard...</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.2)',
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  successIconWrapper: {
    marginBottom: 40,
  },
  successBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  supportLine: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f4f1ea',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    opacity: 0.8,
  },
});
