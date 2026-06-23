import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { locationService, City } from '@/features/location/services/location.service';
import { profileService } from '@/features/profile/services/profile.service';
import { useSchedulePrayerNotifications } from '@/features/notifications/hooks/useSchedulePrayerNotifications';

export interface SavedLocation {
  latitude: number;
  longitude: number;
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  timezone: string;
  locationSource: 'gps' | 'city_selector';
}

interface SaveOptions {
  onboardingStep?: string;
  rescheduleNotifications?: boolean;
}

interface CurrentLocationOptions extends SaveOptions {
  maxDistanceKm?: number;
  fallbackDistanceKm?: number;
  useNearestCityCoordinates?: boolean;
}

const toSavedLocation = (
  city: City,
  locationSource: SavedLocation['locationSource'],
  coordinates?: { latitude: number; longitude: number },
  useNearestCityCoordinates = true
): SavedLocation => ({
  latitude: useNearestCityCoordinates ? city.latitude : coordinates?.latitude ?? city.latitude,
  longitude: useNearestCityCoordinates ? city.longitude : coordinates?.longitude ?? city.longitude,
  city: city.city,
  region: city.region || undefined,
  country: city.country,
  countryCode: city.country_code,
  timezone: city.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  locationSource,
});

export const useSaveLocation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scheduleAll } = useSchedulePrayerNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const persistLocation = useCallback(async (location: SavedLocation, options: SaveOptions = {}) => {
    if (!user?.id) {
      throw new Error('User is not signed in.');
    }

    await profileService.saveLocation(user.id, {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      region: location.region,
      country: location.country,
      country_code: location.countryCode,
      timezone: location.timezone,
      location_source: location.locationSource,
    });

    if (options.onboardingStep) {
      await profileService.updateProfile(user.id, {
        onboarding_step: options.onboardingStep,
      });
    }

    await queryClient.invalidateQueries({ queryKey: ['user_location', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['profile_settings', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['todayPrayers'] });

    if (options.rescheduleNotifications) {
      await scheduleAll(true);
    }

    return location;
  }, [queryClient, scheduleAll, user?.id]);

  const saveCityLocation = useCallback(async (city: City, options: SaveOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      return await persistLocation(toSavedLocation(city, 'city_selector'), options);
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('Could not save location.');
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  }, [persistLocation]);

  const saveCurrentLocation = useCallback(async (options: CurrentLocationOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('LOCATION_PERMISSION_DENIED');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      const reverseResult = await locationService.resolveLocation(latitude, longitude);
      const hintCountry = reverseResult?.country_code;
      const hintCity = reverseResult?.city;

      let resolvedCity = await locationService.findNearestCity(
        latitude,
        longitude,
        options.maxDistanceKm ?? 30,
        hintCountry,
        hintCity
      );

      if (!resolvedCity) {
        resolvedCity = await locationService.findNearestCity(
          latitude,
          longitude,
          options.fallbackDistanceKm ?? 150,
          hintCountry,
          hintCity
        );
      }

      if (!resolvedCity) {
        throw new Error('LOCATION_NOT_FOUND');
      }

      const location = toSavedLocation(
        resolvedCity,
        'gps',
        { latitude, longitude },
        options.useNearestCityCoordinates ?? true
      );

      await persistLocation(location, options);

      return {
        location,
        resolvedCity,
        coordinates: { latitude, longitude },
      };
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('Could not save current location.');
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  }, [persistLocation]);

  return {
    loading,
    error,
    saveCityLocation,
    saveCurrentLocation,
    persistLocation,
  };
};
