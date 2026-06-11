import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ArrowRight } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import { LocationSelector } from '@/components/location/LocationSelector';

export default function LocationStep() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const setLocation = useOnboardingStore((state) => state.setLocation);
  const currentLocation = useOnboardingStore((state) => state.location);

  const handleSelectLocation = async (locationData: {
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

      await profileService.updateProfile(user.id, {
        onboarding_step: 'prayer_settings',
      });

      setLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        countryCode: locationData.country_code,
        timezone: locationData.timezone,
        locationSource: locationData.location_source,
      });

      setIsChanging(false);
      router.push('/onboarding/prayer-settings');
    } catch (error) {
      console.error('[Onboarding Location] Save Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="Set your location"
      subtitle="Choose how you’d like to set your location for accurate prayer times."
    >
      <View style={styles.content}>
        {(!currentLocation || isChanging) ? (
          <LocationSelector
            onSelectLocation={handleSelectLocation}
            isLoading={loading}
            showCancel={!!currentLocation}
            onCancel={() => setIsChanging(false)}
          />
        ) : (
          <AppCard variant="solid" style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <View style={styles.activeBadge}>
                <Check size={12} color="#0f172a" strokeWidth={4} />
              </View>
              <Text style={styles.currentTitle}>Active Location</Text>
            </View>
            
            <View style={styles.locationInfoRow}>
              <Text style={styles.currentValue}>{currentLocation.city}, {currentLocation.country}</Text>
              <TouchableOpacity onPress={() => setIsChanging(true)} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 32 }} />
            
            <AppButton 
              title="Continue to settings" 
              onPress={() => router.push('/onboarding/prayer-settings')}
              variant="outline"
              style={styles.continueButton}
              textStyle={{ color: '#f4f1ea' }}
              icon={<ArrowRight size={18} color="#f4f1ea" strokeWidth={3} />}
              iconPosition="right"
            />
          </AppCard>
        )}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  currentCard: {
    marginTop: 40,
    backgroundColor: '#0f172a',
    borderWidth: 0,
    borderRadius: 32,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  activeBadge: {
    width: 20,
    height: 20,
    backgroundColor: '#f4f1ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  currentTitle: {
    color: '#f4f1ea',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  currentValue: {
    color: '#f4f1ea',
    fontFamily: 'TitanOne_400Regular',
    fontSize: 24,
    flex: 1,
  },
  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  changeButton: {
    backgroundColor: 'rgba(244, 241, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#f4f1ea',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  continueButton: {
    borderColor: 'rgba(244, 241, 234, 0.3)',
    borderRadius: 20,
  },
});
