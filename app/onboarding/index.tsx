import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mars, Venus, UserCircle2, ArrowRight } from 'lucide-react-native';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { GenderOptionCard } from '@/components/onboarding/GenderOptionCard';
import { AppButton } from '@/components/ui/AppButton';
import { genderSchema, GenderFormData } from '@/features/onboarding/schema/onboardingSchema';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/features/profile/services/profile.service';

export default function GenderStep() {
  const router = useRouter();
  const { user } = useAuth();
  const setGender = useOnboardingStore((state) => state.setGender);
  const currentGender = useOnboardingStore((state) => state.gender);

  const { control, handleSubmit, formState: { isValid, isSubmitting } } = useForm<GenderFormData>({
    resolver: zodResolver(genderSchema),
    defaultValues: {
      gender: currentGender?.gender || undefined,
    },
  });

  // Pre-load avatar images for the next step
  React.useEffect(() => {
    const { DEFAULT_AVATARS } = require('@/constants/avatars');
    DEFAULT_AVATARS.forEach((avatar: any) => {
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar.storagePath}`;
      require('react-native').Image.prefetch(url);
    });
  }, []);

  const onSubmit = async (data: GenderFormData) => {
    try {
      if (user) {
        // Save to DB immediately to persist progress
        await profileService.updateProfile(user.id, { 
          gender: data.gender,
          onboarding_step: 'avatar'
        });
        setGender(data);
        router.push('/onboarding/avatar');
      }
    } catch (error) {
      console.error('Error saving gender:', error);
    }
  };

  return (
    <OnboardingLayout
      title="Your Identity"
      subtitle="Tell us a bit about yourself so we can personalize your experience."
      footer={
        <AppButton 
          title="PROCEED TO AVATAR" 
          onPress={handleSubmit(onSubmit)} 
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
          iconPosition="right"
        />
      }
    >
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionLabel}>Select Gender</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <>
              <GenderOptionCard 
                label="Male" 
                selected={value === 'male'} 
                onSelect={() => onChange('male')}
                icon={Mars}
              />
              <GenderOptionCard 
                label="Female" 
                selected={value === 'female'} 
                onSelect={() => onChange('female')}
                icon={Venus}
              />
              <GenderOptionCard 
                label="Prefer not to say" 
                selected={value === 'prefer_not_to_say'} 
                onSelect={() => onChange('prefer_not_to_say')}
                icon={UserCircle2}
              />
            </>
          )}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
});
