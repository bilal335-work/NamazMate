import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Bell } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotificationsStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(false);

  const setNotificationEnabled = useOnboardingStore((state) => state.setNotificationEnabled);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'You can still enable notifications later in Settings.');
        handleSkip();
        return;
      }

      if (user) {
        await profileService.saveNotificationSettings(user.id, {
          prayer_reminders_enabled: true,
          before_prayer_reminder_enabled: true,
          qaza_reminder_enabled: true,
          partner_activity_enabled: true,
          push_notifications_enabled: true,
        });

        await profileService.updateProfile(user.id, {
          onboarding_step: null // Final step before completion screen
        });

        setNotificationEnabled(true);
        router.push('/onboarding/completion');
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
      handleSkip();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (user) {
        await profileService.saveNotificationSettings(user.id, {
          prayer_reminders_enabled: false,
          before_prayer_reminder_enabled: false,
          qaza_reminder_enabled: false,
          partner_activity_enabled: false,
          push_notifications_enabled: false,
        });

        await profileService.updateProfile(user.id, {
          onboarding_step: null
        });

        setNotificationEnabled(false);
        router.push('/onboarding/completion');
      }
    } catch (error) {
      console.error('Error skipping notifications:', error);
    } finally {
      setLoading(false);
    }
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
