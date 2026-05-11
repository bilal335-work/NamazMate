import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mars, Venus, UserCircle2 } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { GenderOptionCard } from '@/features/onboarding/components/GenderOptionCard';
import { AppButton } from '@/components/ui/AppButton';
import { genderSchema, GenderFormData } from '@/features/onboarding/schema/onboardingSchema';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';

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
      title="Tell us about yourself"
      subtitle="Help us personalize your NamazMate experience. You can update this later in Profile."
      footer={
        <AppButton 
          title="Continue" 
          onPress={handleSubmit(onSubmit)} 
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        />
      }
    >
      <View style={styles.optionsContainer}>
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
    paddingTop: 10,
  },
});
