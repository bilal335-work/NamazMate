import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';


import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { prayerSettingsSchema, PrayerSettingsFormData } from '@/features/onboarding/schema/onboardingSchema';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const CALCULATION_METHODS = [
  { label: 'University of Islamic Sciences, Karachi', value: 'KARACHI' },
  { label: 'Islamic Society of North America (ISNA)', value: 'ISNA' },
  { label: 'Muslim World League (MWL)', value: 'MWL' },
  { label: 'Umm al-Qura University, Makkah', value: 'UMM_AL_QURA' },
  { label: 'Egyptian General Authority of Survey', value: 'EGYPTIAN' },
  { label: 'Institute of Geophysics, University of Tehran', value: 'AUTO' },
];

export default function PrayerSettingsStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const setPrayerSettings = useOnboardingStore((state) => state.setPrayerSettings);
  const currentSettings = useOnboardingStore((state) => state.prayerSettings);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<PrayerSettingsFormData>({
    resolver: zodResolver(prayerSettingsSchema),
    defaultValues: {
      calculationMethod: currentSettings?.calculationMethod || 'KARACHI',
      asrMethod: currentSettings?.asrMethod || 'hanafi',
      timeFormat: currentSettings?.timeFormat || '12h',
    },
  });

  const onSubmit = async (data: PrayerSettingsFormData) => {
    try {
      if (user) {
        await profileService.savePrayerSettings(user.id, {
          calculation_method: data.calculationMethod,
          asr_method: data.asrMethod.toUpperCase() as 'STANDARD' | 'HANAFI',
          time_format: data.timeFormat,
        });

        await profileService.updateProfile(user.id, {
          onboarding_step: 'notifications'
        });

        setPrayerSettings(data);
        router.push('/onboarding/notifications');
      }
    } catch (error) {
      console.error('Error saving prayer settings:', error);
    }
  };

  return (
    <OnboardingLayout
      title="Prayer time settings"
      subtitle="We’ll use these settings to calculate your daily prayer times. You can update them later in Profile."
      footer={
        <AppButton 
          title="Continue" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
        />
      }
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.text }]}>Calculation Method</Text>
        <Controller
          control={control}
          name="calculationMethod"
          render={({ field: { onChange, value } }) => (
            <View style={styles.optionsGrid}>
              {CALCULATION_METHODS.map((method) => (
                <TouchableOpacity 
                  key={method.value}
                  onPress={() => onChange(method.value)}
                  style={styles.optionWrapper}
                >
                  <AppCard 
                    variant={value === method.value ? 'solid' : 'outline'}
                    style={[
                      styles.optionCard,
                      value === method.value && { backgroundColor: colors.primary }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.optionLabel, 
                        { color: value === method.value ? colors.background : colors.text }
                      ]}
                      numberOfLines={2}
                    >
                      {method.label}
                    </Text>
                  </AppCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Asr School</Text>
        <Controller
          control={control}
          name="asrMethod"
          render={({ field: { onChange, value } }) => (
            <View style={styles.rowOptions}>
              <TouchableOpacity 
                style={styles.rowOption} 
                onPress={() => onChange('standard')}
              >
                <AppCard 
                  variant={value === 'standard' ? 'solid' : 'outline'}
                  style={[styles.rowCard, value === 'standard' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.rowLabel, { color: value === 'standard' ? colors.background : colors.text }]}>Standard (Shafi, Maliki, Hanbali)</Text>
                </AppCard>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rowOption} 
                onPress={() => onChange('hanafi')}
              >
                <AppCard 
                  variant={value === 'hanafi' ? 'solid' : 'outline'}
                  style={[styles.rowCard, value === 'hanafi' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.rowLabel, { color: value === 'hanafi' ? colors.background : colors.text }]}>Hanafi</Text>
                </AppCard>
              </TouchableOpacity>
            </View>
          )}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Time Format</Text>
        <Controller
          control={control}
          name="timeFormat"
          render={({ field: { onChange, value } }) => (
            <View style={styles.rowOptions}>
              <TouchableOpacity 
                style={styles.rowOption} 
                onPress={() => onChange('12h')}
              >
                <AppCard 
                  variant={value === '12h' ? 'solid' : 'outline'}
                  style={[styles.rowCard, value === '12h' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.rowLabel, { color: value === '12h' ? colors.background : colors.text }]}>12-hour</Text>
                </AppCard>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rowOption} 
                onPress={() => onChange('24h')}
              >
                <AppCard 
                  variant={value === '24h' ? 'solid' : 'outline'}
                  style={[styles.rowCard, value === '24h' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.rowLabel, { color: value === '24h' ? colors.background : colors.text }]}>24-hour</Text>
                </AppCard>
              </TouchableOpacity>
            </View>
          )}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionWrapper: {
    width: '50%',
    padding: 6,
  },
  optionCard: {
    padding: 12,
    height: 80,
    justifyContent: 'center',
    borderRadius: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowOptions: {
    gap: 12,
  },
  rowOption: {
    width: '100%',
  },
  rowCard: {
    padding: 16,
    borderRadius: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
