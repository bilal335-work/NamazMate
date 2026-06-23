import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { signOut } from '@/features/auth/services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ProfileRow } from '@/components/profile/ProfileRow';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 80;
const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { profile, location, prayerSettings, notificationSettings, activePair, isLoading } = useProfileSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const insets = useSafeAreaInsets();

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
            const { error } = await signOut();
            setIsSigningOut(false);
            if (error) {
              Alert.alert('Error', 'Could not sign out. Please try again.');
            } else {
              queryClient.clear();
              router.replace('/(auth)/welcome');
            }
          }
        }
      ]
    );
  };

  const formatLocation = () => {
    if (!location) return 'Not set';
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return 'Location set';
  };

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT + insets.top],
      Extrapolate.CLAMP
    );

    return {
      height,
      backgroundColor: '#f4f1ea',
      zIndex: 10,
    };
  });

  if (isLoading || isSigningOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333333" />
      </View>
    );
  }

  const formatPrayerMethod = () => {
    if (!prayerSettings) return 'Not set';
    return prayerSettings.calculation_method.replace(/_/g, ' ');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedHeader, headerAnimatedStyle]}>
        <ProfileHeader 
          fullName={profile?.full_name || 'User'} 
          email={session?.user?.email || ''} 
          avatarType={profile?.avatar_type as any}
          avatarStyle={profile?.avatar_key}
          onEditAvatar={() => router.push('/profile/avatar')}
          scrollY={scrollY}
          headerMaxHeight={HEADER_MAX_HEIGHT}
          headerMinHeight={HEADER_MIN_HEIGHT + insets.top}
        />
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: HEADER_MAX_HEIGHT + 20 }
        ]} 
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >

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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
