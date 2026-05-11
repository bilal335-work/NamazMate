import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Search, X, ArrowLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/services/supabase/profile.service';
import { locationService, City } from '@/services/location/location.service';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLocation } from '@/features/location/hooks/useLocation';

export default function UpdateLocationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  
  const { 
    countryCode, setCountryCode, 
    region, setRegion, 
    countries, regions, cities: regionCities,
  } = useLocation();

  const [selectionMode, setSelectionMode] = useState<'search' | 'hierarchical'>('search');

  const handleUpdateLocation = async (locationData: any) => {
    if (!user) return;
    setLoading(true);
    try {
      await profileService.saveLocation(user.id, {
        ...locationData,
        updated_at: new Date().toISOString(),
      });
      
      // Invalidate queries to refresh prayer times and location display
      queryClient.invalidateQueries({ queryKey: ['user_location', user.id] });
      queryClient.invalidateQueries({ queryKey: ['todayPrayers'] });
      
      Alert.alert('Success', 'Location updated successfully. Prayer times have been refreshed.');
      router.back();
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Could not update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use GPS.');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      const resolved = await locationService.resolveLocation(latitude, longitude);
      
      if (resolved && resolved.city) {
        await handleUpdateLocation({
          latitude,
          longitude,
          city: resolved.city,
          region: resolved.region || undefined,
          country: resolved.country || '',
          country_code: resolved.country_code || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location_source: 'gps',
        });
      } else {
        Alert.alert('Location Not Found', 'We could not determine your city from GPS. Please select it manually.');
        setShowSearch(true);
      }
    } catch (error) {
      console.error('Error using GPS:', error);
      Alert.alert('Error', 'An error occurred while getting your location.');
    } finally {
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

  const handleSelectCity = (city: City) => {
    handleUpdateLocation({
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.city,
      region: city.region || undefined,
      country: city.country,
      country_code: city.country_code,
      timezone: city.timezone,
      location_source: 'city_selector',
    });
    setShowSearch(false);
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
        <View style={styles.optionSection}>
          <Text style={[styles.sectionLabel, { color: colors.text + '60' }]}>OPTIONS</Text>
          <View style={[styles.card, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
            <TouchableOpacity style={styles.optionRow} onPress={handleUseGPS} disabled={loading}>
              <View style={styles.optionIcon}>
                <MapPin size={20} color={colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Use Current Location</Text>
                <Text style={[styles.optionDesc, { color: colors.text + '40' }]}>Best for accuracy while traveling</Text>
              </View>
              {loading && <ActivityIndicator size="small" color={colors.primary} />}
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />

            <TouchableOpacity style={styles.optionRow} onPress={() => setShowSearch(true)}>
              <View style={styles.optionIcon}>
                <Search size={20} color={colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Choose City Manually</Text>
                <Text style={[styles.optionDesc, { color: colors.text + '40' }]}>Search from thousands of cities</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.text + '40' }]}>
            Your location is used to calculate precise prayer times for your area.
          </Text>
        </View>
      </View>

      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#f4f1ea' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

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
            <View style={{ flex: 1 }}>
              <View style={[styles.searchBar, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
                <Search size={20} color={colors.text + '40'} />
                <TextInput 
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search city..."
                  placeholderTextColor={colors.text + '30'}
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
                    <Text style={[styles.cityRegion, { color: colors.text + '40' }]}>
                      {item.region ? `${item.region}, ` : ''}{item.country}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.text + '30' }]}>
                      {searchQuery.length < 2 ? 'Type at least 2 characters' : 'No cities found'}
                    </Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Hierarchical selection logic (Simplified for space) */}
              {!countryCode ? (
                <FlatList 
                  data={countries}
                  keyExtractor={(item) => item.country_code}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.cityItem} onPress={() => setCountryCode(item.country_code)}>
                      <Text style={[styles.cityName, { color: colors.text }]}>{item.country}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />}
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
                      <TouchableOpacity style={styles.cityItem} onPress={() => setRegion(item)}>
                        <Text style={[styles.cityName, { color: colors.text }]}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />}
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
                      <TouchableOpacity style={styles.cityItem} onPress={() => handleSelectCity(item)}>
                        <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
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
  optionSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 51, 51, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  separator: {
    height: 1,
  },
  infoContainer: {
    paddingHorizontal: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  cityItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cityRegion: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  backLink: {
    paddingVertical: 12,
    marginBottom: 8,
  },
});
