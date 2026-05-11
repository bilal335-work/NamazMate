import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Search, X, Check } from 'lucide-react-native';

import { OnboardingLayout } from '@/features/onboarding/components/OnboardingLayout';
import { LocationOptionCard } from '@/features/onboarding/components/LocationOptionCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import { locationService, City } from '@/services/location/location.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocation } from '@/features/location/hooks/useLocation';

export default function LocationStep() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  
  const setLocation = useOnboardingStore((state) => state.setLocation);
  const currentLocation = useOnboardingStore((state) => state.location);

  const { 
    countryCode, setCountryCode, 
    region, setRegion, 
    countries, regions, cities: regionCities,
    isLoadingCountries, isLoadingRegions, isLoadingCities,
    isCityDataAvailable, isLoadingAvailability
  } = useLocation();

  const [selectionMode, setSelectionMode] = useState<'search' | 'hierarchical'>('search');

  const handleUseGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use GPS. You can choose a city manually.');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      
      const resolved = await locationService.resolveLocation(latitude, longitude);
      
      if (resolved && resolved.city) {
        const locationData = {
          latitude,
          longitude,
          city: resolved.city,
          region: resolved.region || undefined,
          country: resolved.country || '',
          countryCode: resolved.country_code || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locationSource: 'gps' as const,
        };

        if (user) {
          await profileService.saveLocation(user.id, {
            latitude,
            longitude,
            city: resolved.city,
            region: resolved.region || undefined,
            country: resolved.country || '',
            country_code: resolved.country_code || '',
            timezone: locationData.timezone,
            location_source: 'gps',
          });

          await profileService.updateProfile(user.id, {
            onboarding_step: 'prayer_settings'
          });

          setLocation(locationData);
          router.push('/onboarding/prayer-settings');
        }
      } else {
        Alert.alert('Location Not Found', 'We could not determine your city from GPS. Please select it manually.');
        setShowSearch(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error using GPS:', error);
      Alert.alert('Error', 'An error occurred while getting your location.');
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      setSearching(true);
      const results = await locationService.searchCities(text);
      setCities(results);
      setSearching(false);
    } else {
      setCities([]);
    }
  };

  const handleSelectCity = async (city: City) => {
    try {
      if (user) {
        const locationData = {
          latitude: city.latitude,
          longitude: city.longitude,
          city: city.city,
          region: city.region || undefined,
          country: city.country,
          countryCode: city.country_code,
          timezone: city.timezone,
          locationSource: 'city_selector' as const,
        };

        await profileService.saveLocation(user.id, {
          latitude: city.latitude,
          longitude: city.longitude,
          city: city.city,
          region: city.region || undefined,
          country: city.country,
          country_code: city.country_code,
          timezone: city.timezone,
          location_source: 'city_selector',
        });
        
        await profileService.updateProfile(user.id, {
          onboarding_step: 'prayer_settings'
        });

        setLocation(locationData);
        setShowSearch(false);
        router.push('/onboarding/prayer-settings');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Could not save location. Please try again.');
    }
  };

  return (
    <OnboardingLayout
      title="Set your location"
      subtitle="Choose how you’d like to set your location for accurate prayer times."
    >
      <View style={styles.content}>
        <LocationOptionCard 
          label="Use current location"
          description="Best for accuracy while traveling"
          icon={MapPin}
          onSelect={handleUseGPS}
          loading={loading}
        />
        <LocationOptionCard 
          label="Choose city manually"
          description="Search from thousands of cities"
          icon={Search}
          onSelect={() => setShowSearch(true)}
        />

        {currentLocation && (
          <AppCard variant="solid" style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Check size={20} color="#fff" />
              <Text style={styles.currentTitle}>Selected Location</Text>
            </View>
            <Text style={styles.currentValue}>{currentLocation.city}, {currentLocation.country}</Text>
            <AppButton 
              title="Continue" 
              onPress={() => router.push('/onboarding/prayer-settings')}
              variant="outline"
              style={{ borderColor: 'rgba(255,255,255,0.3)', marginTop: 12 }}
              textStyle={{ color: '#fff' }}
            />
          </AppCard>
        )}
      </View>

      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectionMode === 'search' ? 'Search City' : 'Select Location'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowSearch(false);
              setCountryCode(null);
              setRegion(null);
            }}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {!isCityDataAvailable && !isLoadingAvailability ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text, textAlign: 'center', fontWeight: 'bold' }]}>
                City data has not been imported yet.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text + '80', textAlign: 'center', marginTop: 8 }]}>
                Please use &quot;Current Location&quot; or check back later once the administrator has set up the location database.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, selectionMode === 'search' && { borderBottomColor: colors.primary }]}
                  onPress={() => setSelectionMode('search')}
                >
                  <Text style={[styles.tabText, { color: selectionMode === 'search' ? colors.text : colors.text + '50' }]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, selectionMode === 'hierarchical' && { borderBottomColor: colors.primary }]}
                  onPress={() => setSelectionMode('hierarchical')}
                >
                  <Text style={[styles.tabText, { color: selectionMode === 'hierarchical' ? colors.text : colors.text + '50' }]}>Browse</Text>
                </TouchableOpacity>
              </View>

              {selectionMode === 'search' ? (
                <>
                  <View style={[styles.searchBar, { backgroundColor: colors.primary + '10' }]}>
                    <Search size={20} color={colors.text + '80'} />
                    <TextInput 
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search city..."
                      placeholderTextColor={colors.text + '50'}
                      value={searchQuery}
                      onChangeText={handleSearch}
                      autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color={colors.primary} />}
                  </View>

                  <FlatList 
                    data={cities}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.cityItem}
                        onPress={() => handleSelectCity(item)}
                      >
                        <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                        <Text style={[styles.cityRegion, { color: colors.text + '80' }]}>
                          {item.region ? `${item.region}, ` : ''}{item.country}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.text + '50' }]}>
                          {searchQuery.length < 2 ? 'Type at least 2 characters' : 'No cities found'}
                        </Text>
                      </View>
                    )}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '10' }]} />}
                  />
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  {!countryCode ? (
                    <FlatList 
                      data={countries}
                      keyExtractor={(item) => item.country_code}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={styles.cityItem}
                          onPress={() => setCountryCode(item.country_code)}
                        >
                          <Text style={[styles.cityName, { color: colors.text }]}>{item.country}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                          {isLoadingCountries ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.text + '50' }}>No countries found</Text>}
                        </View>
                      )}
                      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '10' }]} />}
                    />
                  ) : !region ? (
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity onPress={() => setCountryCode(null)} style={styles.backLink}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>← Back to Countries</Text>
                      </TouchableOpacity>
                      <FlatList 
                        data={regions}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.cityItem}
                            onPress={() => setRegion(item)}
                          >
                            <Text style={[styles.cityName, { color: colors.text }]}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                          <View style={styles.emptyContainer}>
                            {isLoadingRegions ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.text + '50' }}>No regions found</Text>}
                          </View>
                        )}
                        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '10' }]} />}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity onPress={() => setRegion(null)} style={styles.backLink}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>← Back to Regions</Text>
                      </TouchableOpacity>
                      <FlatList 
                        data={regionCities}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.cityItem}
                            onPress={() => handleSelectCity(item)}
                          >
                            <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                          <View style={styles.emptyContainer}>
                            {isLoadingCities ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.text + '50' }}>No cities found</Text>}
                          </View>
                        )}
                        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '10' }]} />}
                      />
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  currentCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#333',
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  cityItem: {
    paddingVertical: 16,
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cityRegion: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 1,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  backLink: {
    paddingVertical: 12,
    marginBottom: 8,
  },
});
