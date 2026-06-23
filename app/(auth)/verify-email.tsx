import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Linking, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react-native';

import { AppButton } from '@/components/ui/AppButton';
import { getUser, resendVerification, signOut } from '@/features/auth/services/auth.service';
import { WelcomeBackground } from '@/components/animation/WelcomeBackground';
import { useTransition } from '@/features/auth/context/TransitionContext';

export default function VerifyEmailScreen() {
  const { animateAndNavigate } = useTransition();
  const [loading, setLoading] = useState(false);
  const footerLinkRef = useRef<any>(null);
  const verifiedButtonRef = useRef<any>(null);

  const handleOpenEmail = async () => {
    const url = 'mailto:';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Could not open your mail client.');
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await getUser();
      if (user?.email) {
        const { error } = await resendVerification(user.email);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Sent', 'A new verification link has been sent.');
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <WelcomeBackground />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.header}>
              <Text style={styles.logoText}>NamazMate</Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>Verify your email address</Text>
            </View>

            <View style={styles.mainContent}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Mail size={40} color="#1a1a1a" strokeWidth={1.5} />
                </View>
              </View>

              <Text style={styles.message}>
                We&apos;ve sent a verification link to your inbox. Please check your mail to activate your account.
              </Text>

              <View style={{ height: 40 }} />

              <AppButton
                title="OPEN MAIL CLIENT"
                onPress={handleOpenEmail}
                variant="solid"
                icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
                iconPosition="right"
                style={styles.actionButton}
              />
              
              <View style={{ height: 16 }} />
              
              <AppButton
                ref={verifiedButtonRef}
                title="I'VE VERIFIED"
                onPress={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  animateAndNavigate('/(auth)/sign-in', { x: pageX, y: pageY, width: 0, height: 0 });
                }}
                variant="outline"
                style={styles.actionButton}
              />

              <View style={styles.footer}>
                <TouchableOpacity 
                  ref={footerLinkRef}
                  onPress={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    signOut();
                    animateAndNavigate('/(auth)/sign-in', { x: pageX, y: pageY, width: 0, height: 0 });
                  }}
                  style={styles.backToSignIn}
                >
                  <Text style={styles.footerText}>Back to Sign In</Text>
                  <ArrowRight size={16} color="#1a1a1a" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResendEmail}
                disabled={loading}
              >
                <RefreshCw size={14} color="#475569" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={styles.resendText}>Resend verification link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 26, 26, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontFamily: 'System',
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    height: 70,
    borderRadius: 35,
    width: '100%',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    padding: 8,
  },
  resendText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
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
