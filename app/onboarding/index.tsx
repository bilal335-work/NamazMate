import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { supabase } from '@/services/supabase/client';

export default function OnboardingPlaceholder() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Onboarding</Text>
        <Text style={styles.subtitle}>
          Phase 6 will implement the full onboarding flow. 
          For now, this is a placeholder.
        </Text>
        <AppButton 
          title="Sign Out" 
          onPress={handleLogout} 
          variant="outline" 
        />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
    marginBottom: 32,
  },
});
