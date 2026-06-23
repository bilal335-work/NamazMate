import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '@/features/auth/schemas';
import { signUp, signInWithGoogle } from '@/features/auth/services/auth.service';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { hydrateAuthSession } from '@/features/auth/hooks/useAuth';

import { useTransition } from '@/features/auth/context/TransitionContext';

export default function SignUpScreen() {
  const { animateAndNavigate } = useTransition();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastTapCoord, setLastTapCoord] = useState<{ x: number, y: number } | null>(null);
  const [step, setStep] = useState(1);
  
  const footerLinkRef1 = useRef<any>(null);
  const footerLinkRef2 = useRef<any>(null);
  const submitButtonRef = useRef<any>(null);
  const formOffset = useSharedValue(0);

  const { control, handleSubmit, trigger, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const nextStep = async () => {
    const isValid = await trigger(['fullName', 'email']);
    if (isValid) {
      setStep(2);
      formOffset.value = withTiming(-screenWidth, { 
        duration: 400,
        easing: Easing.out(Easing.quad)
      });
    }
  };

  const prevStep = () => {
    setStep(1);
    formOffset.value = withTiming(0, { 
      duration: 400,
      easing: Easing.out(Easing.quad)
    });
  };

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: formOffset.value }],
    };
  });

  const handleFooterNavigation = (e: any) => {
    if (isNavigating) return;
    const { pageX, pageY } = e.nativeEvent;
    setIsNavigating(true);
    animateAndNavigate('/(auth)/sign-in', { x: pageX, y: pageY, width: 0, height: 0 });
  };

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else if (authData.user) {
        if (!authData.session) {
          // Use captured coordinates for transition
          if (lastTapCoord) {
            animateAndNavigate('/(auth)/verify-email', { x: lastTapCoord.x, y: lastTapCoord.y, width: 0, height: 0 });
          } else {
            animateAndNavigate('/(auth)/verify-email');
          }
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
                <Text style={styles.subtitle}>Join Our Global Prayer Community</Text>
              </View>

              <View style={styles.formContainer}>
                <Animated.View style={[styles.animatedForm, { width: screenWidth * 2 }, animatedFormStyle]}>
                  {/* STEP 1 */}
                  <View style={[styles.stepPage, { width: screenWidth - 48 }]}>
                    <Controller
                      control={control}
                      name="fullName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          label="FULL NAME"
                          placeholder="e.g. John Doe"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          error={errors.fullName?.message}
                          autoCapitalize="words"
                        />
                      )}
                    />
                    
                    <View style={{ height: 24 }} />

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

                    <View style={{ height: 32 }} />

                    <AppButton
                      title="NEXT STEP"
                      onPress={nextStep}
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

                    <View style={styles.innerFooter}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity 
                        ref={footerLinkRef1}
                        onPress={handleFooterNavigation}
                        style={styles.footerLinkContainer}
                      >
                        <Text style={styles.footerLink}>Sign In</Text>
                        <ArrowRight size={16} color="#1a1a1a" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* STEP 2 */}
                  <View style={[styles.stepPage, { width: screenWidth - 48 }]}>
                    <View style={styles.stepHeader}>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity 
                        onPress={prevStep} 
                        style={styles.backIconButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-back-outline" size={24} color="#475569" />
                      </TouchableOpacity>
                    </View>

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <AppInput
                            label="PASSWORD"
                            placeholder="........"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.password?.message}
                            secureTextEntry
                          />
                          {!errors.password && (
                            <Text style={styles.helperText}>Password must be at least 8 characters.</Text>
                          )}
                        </View>
                      )}
                    />

                    <View style={{ height: 24 }} />

                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          label="CONFIRM PASSWORD"
                          placeholder="........"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          error={errors.confirmPassword?.message}
                          secureTextEntry
                        />
                      )}
                    />

                    <View style={{ height: 32 }} />

                    <AppButton
                      ref={submitButtonRef}
                      title="CREATE ACCOUNT"
                      onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;
                        setLastTapCoord({ x: pageX, y: pageY });
                        handleSubmit(onSubmit)();
                      }}
                      loading={loading}
                      disabled={googleLoading}
                      variant="solid"
                      style={styles.actionButton}
                    />

                    <View style={[styles.innerFooter, { marginTop: 32 }]}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity 
                        ref={footerLinkRef2}
                        onPress={handleFooterNavigation}
                        style={styles.footerLinkContainer}
                      >
                        <Text style={styles.footerLink}>Sign In</Text>
                        <ArrowRight size={16} color="#1a1a1a" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
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
  formContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  animatedForm: {
    flexDirection: 'row',
  },
  stepPage: {
    marginRight: 48,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    height: 32,
  },
  backIconButton: {
    padding: 4,
  },
  helperText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  actionButton: {
    height: 70,
    borderRadius: 35,
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
  innerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
