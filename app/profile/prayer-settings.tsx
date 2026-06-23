import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';

const CALCULATION_METHODS = [
  { label: 'Automatic (Recommended)', value: 'AUTO' },
  { label: 'University of Islamic Sciences, Karachi', value: 'KARACHI' },
  { label: 'Islamic Society of North America (ISNA)', value: 'ISNA' },
  { label: 'Muslim World League (MWL)', value: 'MWL' },
  { label: 'Umm Al-Qura University, Makkah', value: 'UMM_AL_QURA' },
  { label: 'Egyptian General Authority of Survey', value: 'EGYPTIAN' },
  { label: 'UAE / Dubai', value: 'DUBAI' },
  { label: 'Qatar', value: 'QATAR' },
  { label: 'Kuwait', value: 'KUWAIT' },
];

const ASR_METHODS = [
  { label: 'Standard (Shafi, Maliki, Hanbali)', value: 'STANDARD' },
  { label: 'Hanafi', value: 'HANAFI' },
];

const TIME_FORMATS = [
  { label: '12-hour', value: '12h' },
  { label: '24-hour', value: '24h' },
];

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { prayerSettings, isLoading } = useProfileSettings();
  const { updatePrayerSettings } = useUpdateProfile();

  const [method, setMethod] = useState(prayerSettings?.calculation_method || 'AUTO');
  const [asr, setAsr] = useState(prayerSettings?.asr_method || 'STANDARD');
  const [format, setFormat] = useState(prayerSettings?.time_format || '12h');

  const handleSave = () => {
    updatePrayerSettings.mutate({
      calculation_method: method,
      asr_method: asr as 'STANDARD' | 'HANAFI',
      time_format: format as '12h' | '24h',
    }, {
      onSuccess: () => {
        router.back();
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to update prayer settings');
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const Selector = ({ title, options, value, onChange }: any) => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text + '60' }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
        {options.map((opt: any, index: number) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              index !== options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.text + '05' }
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
            {value === opt.value && <Check size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f4f1ea' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Prayer Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={updatePrayerSettings.isPending}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Selector 
          title="Calculation Method" 
          options={CALCULATION_METHODS} 
          value={method} 
          onChange={setMethod} 
        />
        <Selector 
          title="Asr Calculation" 
          options={ASR_METHODS} 
          value={asr} 
          onChange={setAsr} 
        />
        <Selector 
          title="Time Format" 
          options={TIME_FORMATS} 
          value={format} 
          onChange={setFormat} 
        />
        
        <View style={styles.hintContainer}>
          <Text style={[styles.hintText, { color: colors.text + '40' }]}>
            Changing these settings will recalculate all future prayer times and reschedule your notifications.
          </Text>
        </View>
      </ScrollView>

      {updatePrayerSettings.isPending && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionLabel: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  hintContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
