import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Clock, Users, Zap } from 'lucide-react-native';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/features/profile/services/profile.service';
import { useNotificationPermission } from '@/features/notifications/hooks/useNotificationPermission';

export default function NotificationsStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { requestPermission, skipNotifications, loading } = useNotificationPermission();

  const handleAllow = async () => {
    await requestPermission(true);
    
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
      footer={
        <View style={styles.footer}>
          <AppButton 
            title="Allow notifications" 
            onPress={handleAllow} 
            loading={loading}
            icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
            iconPosition="right"
            style={{ marginBottom: 12 }}
          />
          <AppButton 
            title="Skip for now" 
            onPress={handleSkip} 
            variant="ghost"
            disabled={loading}
          />
        </View>
      }
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>You can get reminders for</Text>
          <View style={styles.featureList}>
            <FeatureItem icon={<Clock size={16} color="#0f172a" />} label="Prayer times" />
            <FeatureItem icon={<Zap size={16} color="#0f172a" />} label="Before prayer starts" />
            <FeatureItem icon={<Clock size={16} color="#0f172a" />} label="Same-day Qaza reminders" />
            <FeatureItem icon={<Users size={16} color="#0f172a" />} label="Duo partner activity" />
          </View>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const FeatureItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.iconBox}>
      {icon}
    </View>
    <Text style={styles.featureLabel}>{label}</Text>
    <Check size={18} color="#0f172a" strokeWidth={3} opacity={0.6} />
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  featureCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  cardTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 20,
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  footer: {
    width: '100%',
    marginTop: 20,
  },
});
