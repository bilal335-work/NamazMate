import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Search, X, Check, ArrowRight } from 'lucide-react-native';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { LocationOptionCard } from '@/components/onboarding/LocationOptionCard';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { locationService, City } from '@/features/location/services/location.service';
import { useLocation } from '@/features/location/hooks/useLocation';
import { useSaveLocation } from '@/features/location/hooks/useSaveLocation';
import { AppModal } from '@/components/ui/AppModal';

export default function LocationStep() {
  const router = useRouter();
  const { loading, saveCurrentLocation, saveCityLocation } = useSaveLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onModalConfirm, setOnModalConfirm] = useState<(() => void) | undefined>(undefined);
  const [modalConfirmLabel, setModalConfirmLabel] = useState('Confirm');
  const [modalSecondaryLabel, setModalSecondaryLabel] = useState('');
  const [onModalSecondary, setOnModalSecondary] = useState<(() => void) | undefined>(undefined);
  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const setLocation = useOnboardingStore((state) => state.setLocation);
  const currentLocation = useOnboardingStore((state) => state.location);

  const { 
    isCityDataAvailable, isLoadingAvailability
  } = useLocation();
  const handleUseGPS = async () => {
    if (loading) return;
    setStatusMessage('Finding your location...');

    try {
      setStatusMessage('Matching nearby city...');
      const { location } = await saveCurrentLocation({
        onboardingStep: 'prayer_settings',
        useNearestCityCoordinates: true,
      });

      setStatusMessage(`Found ${location.city}`);
      setLocation(location);
      setIsChanging(false);
    } catch (error) {
      console.error('[Location] GPS Flow Error:', error);
      setStatusMessage(null);

      if (error instanceof Error && error.message === 'LOCATION_PERMISSION_DENIED') {
        setModalTitle('Location access not enabled');
        setModalMessage('Location access is not enabled. You can allow it in settings or choose your city manually.');
        setModalConfirmLabel('Open Settings');
        setOnModalConfirm(() => () => {
          setModalVisible(false);
          Linking.openSettings();
        });
        setModalSecondaryLabel('Choose City');
        setOnModalSecondary(() => () => {
          setModalVisible(false);
          setShowSearch(true);
        });
        setModalVisible(true);
        return;
      }

      if (error instanceof Error && error.message === 'LOCATION_NOT_FOUND') {
        setModalTitle('We couldn’t find your location');
        setModalMessage('We found your coordinates, but couldn’t match them to a city in our prayer database. Please choose your city manually.');
        setModalConfirmLabel('Choose City');
        setOnModalConfirm(() => () => {
          setModalVisible(false);
          setShowSearch(true);
        });
        setModalSecondaryLabel('Try again');
        setOnModalSecondary(() => () => {
          setModalVisible(false);
          handleUseGPS();
        });
        setModalVisible(true);
        return;
      }

      setModalTitle('Location Error');
      setModalMessage('An error occurred while accessing your location. Please try selecting your city manually.');
      setModalConfirmLabel('Choose City');
      setOnModalConfirm(() => () => {
        setModalVisible(false);
        setShowSearch(true);
      });
      setModalVisible(true);
    } finally {
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
    if (savingLocationId) return;
    setSavingLocationId(city.id);

    try {
      const locationData = await saveCityLocation(city, {
        onboardingStep: 'prayer_settings',
      });

      setLocation(locationData);
      setShowSearch(false);
      setIsChanging(false);
      router.push('/onboarding/prayer-settings');
    } catch (error) {
      console.error('[Location] Save Error:', error);
      setModalTitle('We couldn’t save your location');
      setModalMessage('Please try again, or choose another city.');
      setModalConfirmLabel('Try Again');
      setOnModalConfirm(() => () => {
        setModalVisible(false);
        handleSelectCity(city);
      });
      setModalSecondaryLabel('Choose another');
      setOnModalSecondary(() => () => {
        setModalVisible(false);
      });
      setModalVisible(true);
    } finally {
      setSavingLocationId(null);
    }
  };
  return (
    <OnboardingLayout
      title="Set your location"
      subtitle="Choose how youâ€™d like to set your location for accurate prayer times."
    >
      <View style={styles.content}>
        {(!currentLocation || isChanging) ? (
          <>
            <Text style={styles.label}>Location method</Text>
            
            <LocationOptionCard 
              label={statusMessage || "Use Current Location"}
              description={statusMessage ? "Please wait..." : "Set prayer times using your device location."}
              icon={MapPin}
              onSelect={handleUseGPS}
              loading={loading}
              disabled={loading || !!savingLocationId}
            />
            <LocationOptionCard 
              label="Choose City"
              description="Select your country, region, and city manually."
              icon={Search}
              onSelect={() => setShowSearch(true)}
              loading={!!savingLocationId}
              disabled={loading || !!savingLocationId}
            />

            {currentLocation && !loading && (
              <TouchableOpacity 
                onPress={() => setIsChanging(false)}
                style={styles.cancelChange}
              >
                <Text style={styles.cancelChangeText}>Keep current location</Text>
              </TouchableOpacity>
            )}
          </>
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

      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search City</Text>
            <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.closeButton}>
              <X size={24} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {!isCityDataAvailable && !isLoadingAvailability ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Database Offline</Text>
              <Text style={styles.emptySubtext}>
                City data has not been initialized. Please use current location or contact support.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBar}>
                <Search size={20} color="#0f172a" strokeWidth={2.5} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Enter city name..."
                  placeholderTextColor="rgba(15, 23, 42, 0.4)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color="#0f172a" />}
              </View>

              <FlatList 
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.cityItem, savingLocationId && { opacity: 0.5 }]}
                    onPress={() => handleSelectCity(item)}
                    disabled={!!savingLocationId}
                  >
                    <View>
                      <Text style={styles.cityName}>{item.city}</Text>
                      <Text style={styles.cityRegion}>
                        {item.region ? `${item.region}, ` : ''}{item.country}
                      </Text>
                    </View>
                    {savingLocationId === item.id ? (
                      <ActivityIndicator size="small" color="#0f172a" />
                    ) : (
                      <ArrowRight size={18} color="#0f172a" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    {searchQuery.length >= 2 && !searching && (
                      <Text style={styles.emptyText}>No matches found</Text>
                    )}
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </View>
          )}
        </View>
      </Modal>

      <AppModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        confirmLabel={modalConfirmLabel}
        onConfirm={onModalConfirm}
        secondaryLabel={modalSecondaryLabel}
        onSecondary={onModalSecondary}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 24,
    opacity: 0.6,
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
  cancelChange: {
    marginTop: 16,
    alignSelf: 'center',
    padding: 8,
  },
  cancelChangeText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  continueButton: {
    borderColor: 'rgba(244, 241, 234, 0.3)',
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f1ea',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  modalTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
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
    color: '#0f172a',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cityName: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#0f172a',
  },
  cityRegion: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    opacity: 0.6,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
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
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#0f172a',
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    opacity: 0.4,
  },
});
