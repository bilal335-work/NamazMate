import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform,
  TextInput
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react-native';

import { useDevStore } from '@/features/dev/store/useDevStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useActivePair } from '@/features/duo/hooks/useActivePair';
import { prayerLogService } from '@/features/prayers/services/prayer-log.service';
import { supabase } from '@/services/supabase/client';
import { PrayerKey } from '@/features/prayers/types';

let NativeDatePicker: any = null;
try {
  NativeDatePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  // Native module is not available in current build (e.g. Expo Go)
}

export default function DevPanel() {
  const queryClient = useQueryClient();
  const { user, onboardingCompleted } = useAuth();
  const { data: profile } = useProfile();
  const { data: activePair } = useActivePair();

  const { mockTime, isMockTimeEnabled, setMockTime, disableMockTime } = useDevStore();

  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [textDateInput, setTextDateInput] = useState('');

  React.useEffect(() => {
    if (mockTime) {
      const year = mockTime.getFullYear();
      const month = String(mockTime.getMonth() + 1).padStart(2, '0');
      const date = String(mockTime.getDate()).padStart(2, '0');
      const hours = String(mockTime.getHours()).padStart(2, '0');
      const minutes = String(mockTime.getMinutes()).padStart(2, '0');
      setTextDateInput(`${year}-${month}-${date} ${hours}:${minutes}`);
    } else {
      setTextDateInput('');
    }
  }, [mockTime]);

  if (!__DEV__) return null;

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setMockTime(selectedDate);
    }
  };

  const triggerAction = async (actionName: string, apiCall: () => Promise<any>) => {
    setLoadingAction(actionName);
    try {
      await apiCall();
      await queryClient.invalidateQueries();
      Alert.alert('Success', `${actionName} completed successfully.`);
    } catch (error: any) {
      if (error.message?.includes('non-2xx') || error.status === 403 || error.context?.status === 403) {
        Alert.alert(
          'Dev Tools Not Enabled',
          'ENABLE_DEV_TOOLS is not set on the server.\n\n' +
          'Run: supabase secrets set ENABLE_DEV_TOOLS=true\n' +
          'Then: supabase functions deploy dev-seed',
        );
      } else {
        Alert.alert('Error', error.message ?? 'Unknown error');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetToday = () => {
    triggerAction('Reset Today', async () => {
      const { data, error } = await supabase.functions.invoke('reset-today-prayers-dev');
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Failed to reset today');
    });
  };

  const handleSeedWeek = () => {
    triggerAction('Seed Week Data', async () => {
      const { data, error } = await supabase.functions.invoke('dev-seed?action=seed_week');
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Failed to seed week');
    });
  };

  const handleSeedPartner = () => {
    triggerAction('Seed Fake Partner', async () => {
      const { data, error } = await supabase.functions.invoke('dev-seed?action=seed_partner');
      if (error || !data?.success) throw new Error(error?.message || data?.error || 'Failed to seed partner');
    });
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all prayer logs, pairs, and invites? Settings will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => triggerAction('Clear All Data', async () => {
            const { data, error } = await supabase.functions.invoke('dev-seed?action=clear_all');
            if (error || !data?.success) throw new Error(error?.message || data?.error || 'Failed to clear all data');
          })
        }
      ]
    );
  };

  const handleForceStatus = async (prayerKey: PrayerKey, markType: string) => {
    try {
      await prayerLogService.markPrayer(prayerKey, markType);
      await queryClient.invalidateQueries({ queryKey: ['prayerLog'] });
    } catch (e: any) {
      Alert.alert('Force Failed', e.message || 'Failed to force status');
    }
  };

  const handleQazaPress = (prayerKey: PrayerKey, prayerName: string) => {
    Alert.alert(
      'Mark as Qaza?',
      `This will mark ${prayerName} as Qaza.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleForceStatus(prayerKey, 'qaza_prayed') }
      ]
    );
  };

  const prayers: { key: PrayerKey; name: string }[] = [
    { key: 'fajr', name: 'Fajr' },
    { key: 'dhuhr', name: 'Dhuhr' },
    { key: 'asr', name: 'Asr' },
    { key: 'maghrib', name: 'Maghrib' },
    { key: 'isha', name: 'Isha' },
  ];

  if (!expanded) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        <Settings size={22} color="#ffffff" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>NamazMate Dev Panel</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => setExpanded(false)}>
          <Text style={styles.closeText}>Hide</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1 — Time Override */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 1 — Time Override</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Mock Time Enabled</Text>
            <Switch
              value={isMockTimeEnabled}
              onValueChange={(val) => {
                if (val) {
                  setMockTime(new Date());
                  if (NativeDatePicker) {
                    setShowDatePicker(true);
                  }
                } else {
                  disableMockTime();
                }
              }}
            />
          </View>
          {isMockTimeEnabled && mockTime && (
            <View style={styles.mockTimeDetails}>
              <Text style={styles.textSmall}>Current: {mockTime.toLocaleString()}</Text>
              {NativeDatePicker && (
                <TouchableOpacity 
                  style={styles.btnSmall}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.btnTextSmall}>Change Date/Time</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showDatePicker && NativeDatePicker && (
            <NativeDatePicker
              value={mockTime ?? new Date()}
              mode="datetime"
              display="default"
              onChange={onTimeChange}
            />
          )}

          {isMockTimeEnabled && !NativeDatePicker && (
            <View style={styles.fallbackContainer}>
              <Text style={styles.textSmall}>Enter Date/Time (YYYY-MM-DD HH:mm):</Text>
              <View style={styles.fallbackRow}>
                <TextInput
                  style={styles.fallbackInput}
                  value={textDateInput}
                  onChangeText={setTextDateInput}
                  placeholder="e.g. 2026-06-22 12:00"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity 
                  style={styles.fallbackBtn}
                  onPress={() => {
                    const parts = textDateInput.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
                    if (parts) {
                      const [_, y, m, d, h, min] = parts;
                      const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
                      if (!isNaN(parsed.getTime())) {
                        setMockTime(parsed);
                        Alert.alert('Success', 'Mock time updated.');
                        return;
                      }
                    }
                    const parsedFallback = new Date(textDateInput);
                    if (!isNaN(parsedFallback.getTime())) {
                      setMockTime(parsedFallback);
                      Alert.alert('Success', 'Mock time updated.');
                    } else {
                      Alert.alert('Invalid Format', 'Please use YYYY-MM-DD HH:mm format.');
                    }
                  }}
                >
                  <Text style={styles.btnTextSmall}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* SECTION 2 — Prayer Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 2 — Prayer Actions</Text>
          {loadingAction ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Running {loadingAction}...</Text>
            </View>
          ) : (
            <View style={styles.buttonGrid}>
              <TouchableOpacity style={styles.actionButton} onPress={handleResetToday}>
                <Text style={styles.buttonText}>Reset Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSeedWeek}>
                <Text style={styles.buttonText}>Seed Week Data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSeedPartner}>
                <Text style={styles.buttonText}>Seed Fake Partner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ef4444' }]} onPress={handleClearAll}>
                <Text style={styles.buttonText}>Clear All Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 3 — Auth Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 3 — Auth Info</Text>
          <Text style={styles.infoText}>User ID: {user?.id ?? 'none'}</Text>
          <Text style={styles.infoText}>Email: {user?.email ?? 'none'}</Text>
          <Text style={styles.infoText}>
            Onboarding: {profile ? (profile.onboarding_completed ? 'done' : 'pending') : (onboardingCompleted ? 'done' : 'pending')}
          </Text>
          <Text style={styles.infoText}>Pair ID: {activePair?.id ?? 'none'}</Text>
        </View>

        {/* SECTION 4 — Force prayer status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 4 — Force Prayer Status</Text>
          {prayers.map((prayer) => (
            <View key={prayer.key} style={styles.prayerRow}>
              <Text style={styles.prayerName}>{prayer.name}</Text>
              <View style={styles.prayerButtonsContainer}>
                <View style={styles.prayerButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.forceBtn, { backgroundColor: '#10b981' }]} 
                    onPress={() => handleForceStatus(prayer.key, 'prayed')}
                  >
                    <Text style={styles.forceBtnText}>On time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.forceBtn, { backgroundColor: '#f59e0b' }]} 
                    onPress={() => handleForceStatus(prayer.key, 'qaza_prayed')}
                  >
                    <Text style={styles.forceBtnText}>Late</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.prayerButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.forceBtn, { backgroundColor: '#ef4444' }]} 
                    onPress={() => handleQazaPress(prayer.key, prayer.name)}
                  >
                    <Text style={styles.forceBtnText}>Qaza</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    zIndex: 9999,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: '90%',
    maxWidth: 360,
    height: 450,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 16,
    zIndex: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
  },
  mockTimeDetails: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 8,
  },
  textSmall: {
    color: '#9ca3af',
    fontSize: 11,
    flex: 1,
  },
  btnSmall: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnTextSmall: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 12,
  },
  infoText: {
    color: '#e5e7eb',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prayerName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    width: 60,
  },
  prayerButtonsContainer: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    alignItems: 'flex-end',
  },
  prayerButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  forceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 80,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forceBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  fallbackRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  fallbackInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#111827',
    color: '#ffffff',
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 12,
  },
  fallbackBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
  },
});
