import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Bell } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useNotificationPermission } from '@/features/notifications/hooks/useNotificationPermission';
import { useSchedulePrayerNotifications } from '@/features/notifications/hooks/useSchedulePrayerNotifications';

export default function NotificationsStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { requestPermission, skipNotifications, loading } = useNotificationPermission();
  const { scheduleAll } = useSchedulePrayerNotifications();

  const handleAllow = async () => {
    const granted = await requestPermission(true);
    if (granted) {
      await scheduleAll();
    }
    
    await profileService.updateProfile(user!.id, {
      onboarding_step: null
    });
    router.push('/onboarding/completion');
  };

  const handleSkip = async () => {
    await skipNotifications();
    await profileService.updateProfile(user!.id, {
      onboarding_step: null
    });
    router.push('/onboarding/completion');
  };

  return (
    <OnboardingLayout
      title="Prayer reminders"
      subtitle="Get helpful reminders for prayer times and Duo activity. You can update this later in Profile."
    >
      <View style={styles.content}>
        <View style={[styles.illustration, { backgroundColor: colors.primary + '05' }]}>
          <Bell size={80} color={colors.primary} strokeWidth={1.5} />
        </View>
        
        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Why enable notifications?</Text>
          <Text style={[styles.infoText, { color: colors.text + '80' }]}>
            • Be notified precisely at prayer times{'\n'}
            • Get 10-minute warnings before a prayer ends{'\n'}
            • Stay connected with your Duo partner{'\n'}
            • Important announcements and updates
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton 
          title="Allow Notifications" 
          onPress={handleAllow} 
          loading={loading}
          style={{ marginBottom: 12 }}
        />
        <AppButton 
          title="Skip for Now" 
          onPress={handleSkip} 
          variant="outline"
          disabled={loading}
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
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  infoBox: {
    width: '100%',
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
  },
});
