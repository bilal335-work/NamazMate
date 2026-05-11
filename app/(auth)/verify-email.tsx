import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { supabase } from '@/services/supabase/client';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOpenEmail = async () => {
    // Basic attempt to open email app
    const url = 'mailto:';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Could not open email app.');
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Success', 'Verification email sent!');
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        Alert.alert('Error', error.message);
      } else if (user?.email_confirmed_at) {
        // User is verified, root layout will handle redirect
      } else {
        Alert.alert('Not Verified', 'Please check your email and click the activation link.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.message}>
            We sent an activation link to your email. Please verify your account before continuing.
          </Text>
        </View>

        <View style={styles.footer}>
          <AppButton
            title="Open Email App"
            onPress={handleOpenEmail}
            variant="primary"
          />
          <View style={{ height: 16 }} />
          <AppButton
            title="I've Verified"
            onPress={handleCheckVerification}
            loading={loading}
            variant="outline"
          />
          <View style={{ height: 16 }} />
          <AppButton
            title="Resend Email"
            onPress={handleResendEmail}
            variant="link"
          />
          <View style={{ height: 16 }} />
          <AppButton
            title="Back to Sign In"
            onPress={() => {
              supabase.auth.signOut();
              router.replace('/(auth)/sign-in');
            }}
            variant="link"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333333',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    marginBottom: 40,
  },
});
