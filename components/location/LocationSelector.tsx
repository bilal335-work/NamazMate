import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Linking, useColorScheme, Alert } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Search, X, ArrowRight } from 'lucide-react-native';
import { locationService } from '@/services/location/location.service';
import { City } from '@/types/location';
import { useLocation } from '@/features/location/hooks/useLocation';
import Colors from '@/constants/Colors';

const GPS_TIMEOUT_MS = 12000;

interface LocationSelectorProps {
  onSelectLocation: (locationData: {
    latitude: number;
    longitude: number;
    city: string;
    region?: string;
    country: string;
    country_code: string;
    timezone: string;
    location_source: 'gps' | 'city_selector';
  }) => Promise<void> | void;
  isLoading?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onSelectLocation,
  isLoading: parentLoading = false,
  onCancel,
  showCancel = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);

  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);

  const showDialog = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
    secondaryLabel?: string,
    onSecondary?: () => void
  ) => {
    const buttons: any[] = [];
    if (secondaryLabel && onSecondary) {
      buttons.push({
        text: secondaryLabel,
        onPress: onSecondary,
        style: 'cancel',
      });
    }
    buttons.push({
      text: confirmLabel,
      onPress: onConfirm,
    });
    Alert.alert(title, message, buttons);
  };

  // Hierarchical browser state
  const [selectionMode, setSelectionMode] = useState<'search' | 'browse'>('search');
  const {
    countryCode, setCountryCode,
    region, setRegion,
    countries, regions, cities: regionCities,
    isCityDataAvailable, isLoadingAvailability
  } = useLocation();

  const handleUseGPS = async () => {
    if (loading || parentLoading) return;
    setLoading(true);
    setStatusMessage('Finding your location...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMessage(null);
        showDialog(
          'Location access not enabled',
          'Location access is not enabled. You can allow it in settings or choose your city manually.',
          'Open Settings',
          () => { Linking.openSettings(); },
          'Choose City',
          () => { setShowSearch(true); }
        );
        setLoading(false);
        return;
      }

      let pos: Location.LocationObject | null = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GPS_TIMEOUT')), GPS_TIMEOUT_MS)
        );
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        pos = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      } catch {
        pos = await Location.getLastKnownPositionAsync({});
        if (!pos) {
          setStatusMessage(null);
          showDialog(
            'We couldn’t find your location',
            'Your device location took too long to respond. You can try again or choose your city manually.',
            'Try again',
            () => { handleUseGPS(); },
            'Choose City',
            () => { setShowSearch(true); }
          );
          setLoading(false);
          return;
        }
      }

      const { latitude, longitude } = pos.coords;
      setStatusMessage('Matching nearby city...');

      const reverseResult = await locationService.resolveLocation(latitude, longitude);
      const hintCountry = reverseResult?.country_code;
      const hintCity = reverseResult?.city;

      let resolvedCity: any = await locationService.findNearestCity(
        latitude,
        longitude,
        30,
        hintCountry,
        hintCity
      );

      if (!resolvedCity) {
        resolvedCity = await locationService.findNearestCity(latitude, longitude, 150, hintCountry, hintCity);
      }

      if (resolvedCity && resolvedCity.city) {
        const isConfident =
          resolvedCity.distance_km <= 25 &&
          resolvedCity.score <= 50 &&
          ['city', 'town', 'cantonment', 'municipality'].includes(resolvedCity.place_type);

        if (isConfident) {
          setStatusMessage(`Found ${resolvedCity.city}`);
          await new Promise(resolve => setTimeout(resolve, 800));
          setStatusMessage('Saving location...');

          await onSelectLocation({
            latitude: resolvedCity.latitude || latitude,
            longitude: resolvedCity.longitude || longitude,
            city: resolvedCity.city,
            region: resolvedCity.region || undefined,
            country: resolvedCity.country || '',
            country_code: resolvedCity.country_code || '',
            timezone: resolvedCity.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            location_source: 'gps',
          });
        } else {
          setStatusMessage(null);
          showDialog(
            'Confirm your location',
            `We found ${resolvedCity.city}, ${resolvedCity.country} for your prayer times.`,
            'Use this location',
            async () => {
              setLoading(true);
              try {
                await onSelectLocation({
                  latitude: resolvedCity.latitude || latitude,
                  longitude: resolvedCity.longitude || longitude,
                  city: resolvedCity.city,
                  region: resolvedCity.region || undefined,
                  country: resolvedCity.country || '',
                  country_code: resolvedCity.country_code || '',
                  timezone: resolvedCity.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  location_source: 'gps',
                });
              } catch (err) {
                console.error('[LocationSelector] Confirmation Save Error:', err);
              } finally {
                setLoading(false);
              }
            },
            'Choose another',
            () => { setShowSearch(true); }
          );
        }
      } else {
        setStatusMessage(null);
        showDialog(
          'We couldn’t find your location',
          'We found your coordinates, but couldn’t match them to a city in our database. Please choose manually.',
          'Choose City',
          () => { setShowSearch(true); },
          'Try again',
          () => { handleUseGPS(); }
        );
      }
    } catch (error) {
      console.error('[LocationSelector] GPS Flow Error:', error);
      setStatusMessage(null);
      showDialog(
        'Location Error',
        'An error occurred while accessing location. Please try manually.',
        'Choose City',
        () => { setShowSearch(true); }
      );
    } finally {
      setLoading(false);
      setStatusMessage(null);
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
    if (savingLocationId || parentLoading) return;
    setSavingLocationId(city.id);

    try {
      await onSelectLocation({
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
    } catch (error) {
      console.error('[LocationSelector] Save Error:', error);
      showDialog(
        'We couldn’t save your location',
        'Please try again, or choose another city.',
        'Try Again',
        () => { handleSelectCity(city); },
        'Choose another',
        () => {}
      );
    } finally {
      setSavingLocationId(null);
    }
  };

  const isGlobalLoading = loading || parentLoading;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.text + '60' }]}>LOCATION METHOD</Text>

      <View style={[styles.card, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleUseGPS}
          disabled={isGlobalLoading}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primary + '10' }]}>
            <MapPin size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              {statusMessage || "Use Current Location"}
            </Text>
            <Text style={[styles.optionDesc, { color: colors.text + '40' }]}>
              {statusMessage ? "Please wait..." : "Set prayer times using your device GPS."}
            </Text>
          </View>
          {isGlobalLoading && !savingLocationId && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>

        <View style={[styles.separator, { backgroundColor: colors.text + '05' }]} />

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setShowSearch(true)}
          disabled={isGlobalLoading}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primary + '10' }]}>
            <Search size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, { color: colors.text }]}>Choose City Manually</Text>
            <Text style={[styles.optionDesc, { color: colors.text + '40' }]}>Search or browse our global city database.</Text>
          </View>
          {!!savingLocationId && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>
      </View>

      {showCancel && onCancel && !isGlobalLoading && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
          <Text style={[styles.cancelLinkText, { color: colors.text + '50' }]}>Keep current location</Text>
        </TouchableOpacity>
      )}

      {/* Manual Selection Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#f4f1ea' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {!isCityDataAvailable && !isLoadingAvailability ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Database Offline</Text>
              <Text style={[styles.emptySubtext, { color: colors.text + '50' }]}>
                City data has not been initialized. Please use current location.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, selectionMode === 'search' && { borderBottomColor: colors.primary }]}
                  onPress={() => setSelectionMode('search')}
                >
                  <Text style={[styles.tabText, { color: selectionMode === 'search' ? colors.text : colors.text + '50' }]}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, selectionMode === 'browse' && { borderBottomColor: colors.primary }]}
                  onPress={() => setSelectionMode('browse')}
                >
                  <Text style={[styles.tabText, { color: selectionMode === 'browse' ? colors.text : colors.text + '50' }]}>Browse</Text>
                </TouchableOpacity>
              </View>

              {selectionMode === 'search' ? (
                <View style={{ flex: 1 }}>
                  <View style={[styles.searchBar, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
                    <Search size={20} color={colors.text + '40'} strokeWidth={2.5} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Enter city name..."
                      placeholderTextColor={colors.text + '40'}
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
                        style={[styles.cityItem, !!savingLocationId && { opacity: 0.5 }]}
                        onPress={() => handleSelectCity(item)}
                        disabled={!!savingLocationId}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                          <Text style={[styles.cityRegion, { color: colors.text + '40' }]}>
                            {item.region ? `${item.region}, ` : ''}{item.country}
                          </Text>
                        </View>
                        {savingLocationId === item.id ? (
                          <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                          <ArrowRight size={18} color={colors.text} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        {searchQuery.length >= 2 && !searching && (
                          <Text style={[styles.emptyText, { color: colors.text + '40' }]}>No matches found</Text>
                        )}
                      </View>
                    )}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '08' }]} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  {!countryCode ? (
                    <FlatList
                      data={countries}
                      keyExtractor={(item) => item.country_code}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.cityItem} onPress={() => setCountryCode(item.country_code)}>
                          <Text style={[styles.cityName, { color: colors.text }]}>{item.country}</Text>
                          <ArrowRight size={18} color={colors.text} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '08' }]} />}
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
                            <ArrowRight size={18} color={colors.text} strokeWidth={2.5} />
                          </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '08' }]} />}
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
                            style={[styles.cityItem, !!savingLocationId && { opacity: 0.5 }]}
                            onPress={() => handleSelectCity(item)}
                            disabled={!!savingLocationId}
                          >
                            <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                            {savingLocationId === item.id ? (
                              <ActivityIndicator size="small" color={colors.text} />
                            ) : (
                              <ArrowRight size={18} color={colors.text} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.text + '08' }]} />}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 0.5,
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
  cancelLink: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 8,
  },
  cancelLinkText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    textDecorationLine: 'underline',
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
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
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
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 2.5,
    borderColor: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 24,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 16,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  cityName: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 18,
  },
  cityRegion: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 64,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
  },
  backLink: {
    paddingVertical: 12,
    marginBottom: 8,
  },
});
