import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormData } from '@/features/auth/schemas';
import { updatePassword } from '@/features/auth/services/auth.service';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import { useTransition } from '@/features/auth/context/TransitionContext';

export default function ResetPasswordScreen() {
  const { animateAndNavigate } = useTransition();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [lastTapCoord, setLastTapCoord] = useState<{ x: number, y: number } | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const { error } = await updatePassword(data.password);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Your password has been updated successfully.');
        
        // Use captured coordinates for transition back to sign in
        if (lastTapCoord) {
          animateAndNavigate('/(auth)/sign-in', { x: lastTapCoord.x, y: lastTapCoord.y, width: 0, height: 0 });
        } else {
          animateAndNavigate('/(auth)/sign-in');
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <WelcomeBackground />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { minHeight: screenHeight - 100 }]} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.topSection}>
              <View style={styles.header}>
                <Text style={styles.logoText}>NamazMate</Text>
                <View style={styles.divider} />
                <Text style={styles.subtitle}>Set New Password</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.infoText}>
                  Please enter your new password below. Make sure it&apos;s at least 8 characters long.
                </Text>

                <View style={{ height: 32 }} />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="NEW PASSWORD"
                      placeholder="........"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      secureTextEntry
                    />
                  )}
                />

                <View style={{ height: 24 }} />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="CONFIRM NEW PASSWORD"
                      placeholder="........"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.confirmPassword?.message}
                      secureTextEntry
                    />
                  )}
                />

                <View style={{ height: 40 }} />

                <AppButton
                  title="UPDATE PASSWORD"
                  onPress={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    setLastTapCoord({ x: pageX, y: pageY });
                    handleSubmit(onSubmit)();
                  }}
                  loading={loading}
                  variant="solid"
                  style={styles.actionButton}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 48,
    color: '#0f172a',
    letterSpacing: -1,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#0f172a',
    borderRadius: 2,
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
  },
});
