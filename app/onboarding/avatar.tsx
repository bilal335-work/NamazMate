import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, ShieldCheck, Sparkles } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { avatarSchema, AvatarFormData } from '@/features/onboarding/schema/onboardingSchema';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AVATAR_STYLES = [
  { id: 'islamic_minimal', label: 'Islamic Minimal', icon: User },
  { id: 'geometric', label: 'Geometric', icon: ShieldCheck },
  { id: 'abstract', label: 'Abstract', icon: Sparkles },
];

export default function AvatarStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const setAvatar = useOnboardingStore((state) => state.setAvatar);
  const currentAvatar = useOnboardingStore((state) => state.avatar);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      avatarType: currentAvatar?.avatarType || 'default_vector',
      avatarStyle: currentAvatar?.avatarStyle || 'islamic_minimal',
    },
  });

  const onSubmit = async (data: AvatarFormData) => {
    try {
      if (user) {
        await profileService.updateProfile(user.id, {
          avatar_type: data.avatarType,
          avatar_style: data.avatarStyle,
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
      title="Choose your avatar"
      subtitle="Select a style that represents you. You can upload a custom photo later."
      footer={
        <AppButton 
          title="Continue" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
        />
      }
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.text }]}>Avatar Style</Text>
        <Controller
          control={control}
          name="avatarStyle"
          render={({ field: { onChange, value } }) => (
            <View style={styles.optionsGrid}>
              {AVATAR_STYLES.map((style) => (
                <TouchableOpacity 
                  key={style.id}
                  onPress={() => onChange(style.id)}
                  style={styles.optionWrapper}
                >
                  <AppCard 
                    variant={value === style.id ? 'solid' : 'outline'}
                    style={[
                      styles.optionCard,
                      value === style.id && { backgroundColor: colors.primary }
                    ]}
                  >
                    <style.icon 
                      size={32} 
                      color={value === style.id ? colors.background : colors.primary} 
                      style={{ marginBottom: 12 }}
                    />
                    <Text 
                      style={[
                        styles.optionLabel, 
                        { color: value === style.id ? colors.background : colors.text }
                      ]}
                    >
                      {style.label}
                    </Text>
                  </AppCard>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        
        <View style={styles.previewContainer}>
          <View style={[styles.previewCircle, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
             <User size={64} color={colors.primary} />
          </View>
          <Text style={[styles.previewText, { color: colors.text + '60' }]}>
            Default vector avatar will be used
          </Text>
        </View>
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
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionWrapper: {
    width: '100%',
    padding: 6,
  },
  optionCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  previewContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
  },
});
