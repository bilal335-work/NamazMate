import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>NamazMate</Text>
          <Text style={styles.subtitle}>
            Track your prayers, stay consistent, and connect with a prayer partner.
          </Text>
        </View>

        <View style={styles.footer}>
          <AppButton
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            variant="primary"
          />
          <View style={{ height: 16 }} />
          <AppButton
            title="I already have an account"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea', // Cream background from DESIGN_SYSTEM
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 100,
    alignItems: 'center',
  },
  brand: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333', // Charcoal from DESIGN_SYSTEM
    marginBottom: 16,
    // Note: Titan One font should be added later in Phase 4/5
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333333',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    marginBottom: 40,
  },
});
