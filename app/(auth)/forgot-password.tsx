import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/features/auth/services/auth.service';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { ArrowRight } from 'lucide-react-native';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import { useTransition } from '@/features/auth/context/TransitionContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { animateAndNavigate } = useTransition();
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [lastTapCoord, setLastTapCoord] = useState<{ x: number, y: number } | null>(null);
  const footerLinkRef = useRef<any>(null);
  const submitButtonRef = useRef<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password reset link has been sent to your email.');
        
        // Use captured coordinates for transition
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
                <Text style={styles.subtitle}>Reset your password</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.infoText}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Text>

                <View style={{ height: 32 }} />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="EMAIL ADDRESS"
                      placeholder="name@namazmate.com"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />

                <View style={{ height: 40 }} />

                <AppButton
                  ref={submitButtonRef}
                  title="SEND RESET LINK"
                  onPress={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    setLastTapCoord({ x: pageX, y: pageY });
                    handleSubmit(onSubmit)();
                  }}
                  loading={loading}
                  variant="solid"
                  icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
                  iconPosition="right"
                  style={styles.actionButton}
                />

                <View style={styles.footer}>
                  <TouchableOpacity 
                    ref={footerLinkRef}
                    onPress={(e) => {
                      const { pageX, pageY } = e.nativeEvent;
                      animateAndNavigate('/(auth)/sign-in', { x: pageX, y: pageY, width: 0, height: 0 });
                    }}
                    style={styles.backToSignIn}
                  >
                    <Text style={styles.footerText}>Back to Sign In</Text>
                    <ArrowRight size={16} color="#1a1a1a" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
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
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  topSection: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 52,
    color: '#1a1a1a',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  divider: {
    height: 3,
    width: 64,
    backgroundColor: '#1a1a1a',
    marginVertical: 20,
    borderRadius: 2,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 260,
  },
  form: {
    width: '100%',
  },
  infoText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    height: 70,
    borderRadius: 35,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToSignIn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
  },
});
