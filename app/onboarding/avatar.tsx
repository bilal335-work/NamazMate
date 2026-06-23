import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, ArrowRight } from 'lucide-react-native';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { avatarSchema, AvatarFormData } from '@/features/onboarding/schema/onboardingSchema';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/features/profile/services/profile.service';


export default function AvatarStep() {
  const router = useRouter();
  const { user } = useAuth();

  const setAvatar = useOnboardingStore((state) => state.setAvatar);
  const currentAvatar = useOnboardingStore((state) => state.avatar);
  const gender = useOnboardingStore((state) => state.gender?.gender);

  const { control, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      avatarType: currentAvatar?.avatarType || 'default_vector',
      avatarStyle: currentAvatar?.avatarStyle || 'islamic_minimal',
      avatarKey: currentAvatar?.avatarKey || undefined,
    },
  });

  const selectedKey = watch('avatarKey');

  const onSubmit = async (data: AvatarFormData) => {
    try {
      if (user) {
        await profileService.updateProfile(user.id, {
          avatar_type: data.avatarType,
          avatar_style: data.avatarStyle,
          avatar_key: data.avatarKey,
          onboarding_step: 'location'
        });
        setAvatar(data);
        router.push('/onboarding/location');
      }
    } catch (error) {
      console.error('Error saving avatar settings:', error);
    }
  };

  return (
    <OnboardingLayout
      title="Profile Avatar"
      subtitle="Select a visual identity for your prayer journey. You can modify this later."
      footer={
        <AppButton 
          title="CONTINUE" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
          variant="solid"
          disabled={!selectedKey}
          icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
          iconPosition="right"
        />
      }
    >
      <View style={styles.contentContainer}>
        <Text style={styles.label}>Select Avatar</Text>
        
        <AvatarPicker 
          gender={gender}
          selectedAvatarKey={selectedKey || null}
          onSelect={(avatar) => {
            setValue('avatarKey', avatar.storagePath);
          }}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
});
