import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/features/auth/schemas';
import { signIn, signInWithGoogle } from '@/features/auth/services/auth.service';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { ArrowRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import { hydrateAuthSession } from '@/features/auth/hooks/useAuth';

import { useTransition } from '@/features/auth/context/TransitionContext';

export default function SignInScreen() {
  const { animateAndNavigate } = useTransition();
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastTapCoord, setLastTapCoord] = useState<{ x: number, y: number } | null>(null);
  
  const footerLinkRef = useRef<any>(null);
  const forgotPasswordRef = useRef<any>(null);
  const submitButtonRef = useRef<any>(null);
  const googleButtonRef = useRef<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFooterNavigation = () => {
    if (isNavigating) return;
    
    footerLinkRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (typeof x === 'number') {
        setIsNavigating(true);
        animateAndNavigate('/(auth)/sign-up', { x, y, width, height });
      } else {
        animateAndNavigate('/(auth)/sign-up');
      }
    });
  };

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await signIn({
        email: data.email,
        password: data.password,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
      } else if (authData.user && !authData.session) {
        // Handle redirect to verify email with transition
        if (lastTapCoord) {
          animateAndNavigate('/(auth)/verify-email', { x: lastTapCoord.x, y: lastTapCoord.y, width: 0, height: 0 });
        } else {
          animateAndNavigate('/(auth)/verify-email');
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <Ionicons name="logo-google" size={18} color="#1a1a1a" />
  );

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
                <Text style={styles.subtitle}>Welcome back to your journey</Text>
              </View>

              <View style={styles.form}>
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

                <View style={{ height: 24 }} />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      label="PASSWORD"
                      placeholder="........"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      secureTextEntry
                    />
                  )}
                />

                <TouchableOpacity 
                  ref={forgotPasswordRef}
                  style={styles.forgotPasswordContainer} 
                  onPress={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    animateAndNavigate('/(auth)/forgot-password', { x: pageX, y: pageY, width: 0, height: 0 });
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />

                <AppButton
                  ref={submitButtonRef}
                  title="SIGN IN"
                  onPress={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    setLastTapCoord({ x: pageX, y: pageY });
                    handleSubmit(onSubmit)();
                  }}
                  loading={loading}
                  disabled={googleLoading}
                  variant="solid"
                  icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
                  iconPosition="right"
                  style={styles.actionButton}
                />

                <View style={styles.orDividerContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <AppButton
                  ref={googleButtonRef}
                  title="CONTINUE WITH GOOGLE"
                  onPress={async (e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    setLastTapCoord({ x: pageX, y: pageY });
                    
                    setGoogleLoading(true);
                    try {
                      const { data, error } = await signInWithGoogle();
                      if (error) {
                        Alert.alert('Google Sign-In Error', error.message);
                      } else if (data.session) {
                        await hydrateAuthSession(data.session);
                      }
                    } finally {
                      setGoogleLoading(false);
                    }
                  }}
                  loading={googleLoading}
                  loadingText="SIGNING WITH GOOGLE..."
                  disabled={loading}
                  variant="outline"
                  icon={<GoogleIcon />}
                  iconPosition="left"
                  style={styles.actionButton}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                  <TouchableOpacity 
                    ref={footerLinkRef}
                    onPress={(e) => {
                      if (isNavigating) return;
                      const { pageX, pageY } = e.nativeEvent;
                      setIsNavigating(true);
                      animateAndNavigate('/(auth)/sign-up', { x: pageX, y: pageY, width: 0, height: 0 });
                    }}
                    style={styles.footerLinkContainer}
                  >
                    <Text style={styles.footerLink}>Sign Up</Text>
                    <ArrowRight size={16} color="#1a1a1a" style={{ marginLeft: 4 }} />
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  actionButton: {
    height: 70,
    borderRadius: 35, // Perfect Pill
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a1a1a',
    opacity: 0.1,
  },
  orText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#64748b',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
