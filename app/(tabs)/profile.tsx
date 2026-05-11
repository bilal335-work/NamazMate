import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { supabase } from '@/services/supabase/client';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ProfileRow } from '@/components/profile/ProfileRow';

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile, location, prayerSettings, notificationSettings, activePair, isLoading } = useProfileSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            const { error } = await supabase.auth.signOut();
            setIsSigningOut(false);
            if (error) {
              Alert.alert('Error', 'Could not sign out. Please try again.');
            } else {
              router.replace('/(auth)/welcome');
            }
          }
        }
      ]
    );
  };

  if (isLoading || isSigningOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333333" />
      </View>
    );
  }

  const formatLocation = () => {
    if (!location) return 'Not set';
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return 'Location set';
  };

  const formatPrayerMethod = () => {
    if (!prayerSettings) return 'Not set';
    return prayerSettings.calculation_method.replace(/_/g, ' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileHeader 
          fullName={profile?.full_name || 'User'} 
          email={session?.user?.email || ''} 
          onEditAvatar={() => {
            // TODO: implement avatar picker modal/sheet
            Alert.alert('Change Avatar', 'Custom avatars will be supported in a future update.');
          }}
        />

        <ProfileSection title="Account">
          <ProfileRow 
            label="Edit Profile" 
            value={profile?.full_name} 
            onPress={() => router.push('/profile/edit')} 
          />
          <ProfileRow 
            label="Avatar" 
            onPress={() => router.push('/profile/avatar')} 
          />
          <ProfileRow 
            label="Location" 
            value={formatLocation()} 
            onPress={() => router.push('/profile/location')} 
            isLast 
          />
        </ProfileSection>

        <ProfileSection title="Prayer Settings">
          <ProfileRow 
            label="Calculation Method" 
            value={formatPrayerMethod()} 
            onPress={() => router.push('/profile/prayer-settings')} 
          />
          <ProfileRow 
            label="Asr Method" 
            value={prayerSettings?.asr_method === 'HANAFI' ? 'Hanafi' : 'Standard'} 
            onPress={() => router.push('/profile/prayer-settings')} 
          />
          <ProfileRow 
            label="Time Format" 
            value={prayerSettings?.time_format || '12h'} 
            onPress={() => router.push('/profile/prayer-settings')} 
            isLast 
          />
        </ProfileSection>

        <ProfileSection title="Notifications">
          <ProfileRow 
            label="Manage Notifications" 
            value={notificationSettings?.prayer_reminders_enabled ? 'On' : 'Off'} 
            onPress={() => router.push('/profile/notification-settings')} 
            isLast
          />
        </ProfileSection>

        <ProfileSection title="Duo">
          <ProfileRow 
            label="Partner Status" 
            value={activePair ? 'Paired' : 'Not paired'} 
            onPress={activePair ? undefined : () => router.push('/(tabs)/duo')} 
            isLast 
          />
        </ProfileSection>

        <ProfileSection title="App Info">
          <ProfileRow 
            label="Privacy Policy" 
            onPress={() => Alert.alert('Privacy Policy', 'Standard Privacy Policy for NamazMate.')} 
          />
          <ProfileRow 
            label="Terms of Service" 
            onPress={() => Alert.alert('Terms of Service', 'Standard Terms of Service for NamazMate.')} 
          />
          <ProfileRow 
            label="About NamazMate" 
            value="v1.0.0" 
            onPress={() => Alert.alert('About', 'NamazMate is your personal prayer companion.')} 
            isLast 
          />
        </ProfileSection>

        <View style={styles.logoutContainer}>
          <ProfileRow 
            label="Sign Out" 
            onPress={handleLogout} 
            destructive 
            isLast 
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f4f1ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  logoutContainer: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.1)',
  },
  bottomPadding: {
    height: 40,
  },
});
