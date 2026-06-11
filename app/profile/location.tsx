import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSchedulePrayerNotifications } from '@/features/notifications/hooks/useSchedulePrayerNotifications';
import { LocationSelector } from '@/components/location/LocationSelector';

export default function UpdateLocationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scheduleAll } = useSchedulePrayerNotifications();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);

  const handleUpdateLocation = async (locationData: {
    latitude: number;
    longitude: number;
    city: string;
    region?: string;
    country: string;
    country_code: string;
    timezone: string;
    location_source: 'gps' | 'city_selector';
  }) => {
    if (!user) return;
    setLoading(true);
    try {
      await profileService.saveLocation(user.id, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        country_code: locationData.country_code,
        timezone: locationData.timezone,
        location_source: locationData.location_source,
      });
      
      // Invalidate queries to refresh prayer times and location display
      await queryClient.invalidateQueries({ queryKey: ['user_location', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['todayPrayers'] });
      
      // Reschedule notifications for new location
      await scheduleAll(true);
      
      Alert.alert('Success', 'Location updated successfully. Prayer times have been refreshed.');
      router.back();
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Could not update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f4f1ea' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Change Location</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <LocationSelector 
          onSelectLocation={handleUpdateLocation}
          isLoading={loading}
        />
        
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.text + '40' }]}>
            Your location is used to calculate precise prayer times for your area.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  infoContainer: {
    paddingHorizontal: 12,
    marginTop: 32,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
