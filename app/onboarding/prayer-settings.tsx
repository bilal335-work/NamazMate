import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Animated, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ArrowRight, ChevronDown, X } from 'lucide-react-native';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AppModal } from '@/components/ui/AppModal';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileService } from '@/features/profile/services/profile.service';

const CALCULATION_METHODS = [
  { label: 'University of Islamic Sciences, Karachi', value: 'KARACHI', description: 'Common in South Asia' },
  { label: 'Islamic Society of North America', value: 'ISNA', description: 'Used in USA and Canada' },
  { label: 'Muslim World League', value: 'MWL', description: 'Standard method in Europe' },
  { label: 'Umm al-Qura University, Makkah', value: 'UMM_AL_QURA', description: 'Used in Saudi Arabia' },
  { label: 'Egyptian General Authority', value: 'EGYPTIAN', description: 'Common in Middle East' },
  { label: 'Dubai', value: 'DUBAI', description: 'Used in UAE' },
];

const ASR_METHODS = [
  { label: 'Standard / Shafi', value: 'standard', description: 'Shafi, Maliki, Hanbali schools' },
  { label: 'Hanafi', value: 'hanafi', description: 'Common in South Asia' },
];

const TIME_FORMATS = [
  { label: '12-hour', value: '12h', description: 'Example: 5:30 PM' },
  { label: '24-hour', value: '24h', description: 'Example: 17:30' },
];

export default function PrayerSettingsStep() {
  const router = useRouter();
  const { user } = useAuth();
  const currentLocation = useOnboardingStore((state) => state.location);
  const setPrayerSettings = useOnboardingStore((state) => state.setPrayerSettings);
  const currentSettings = useOnboardingStore((state) => state.prayerSettings);

  // Helper to get initial calc method based on location
  const getInitialCalcMethod = () => {
    if (currentSettings?.calculationMethod) return currentSettings.calculationMethod;
    if (currentLocation) {
      const code = currentLocation.countryCode?.toUpperCase();
      if (['PK', 'IN', 'BD'].includes(code)) return 'KARACHI';
      if (code === 'SA') return 'UMM_AL_QURA';
      if (code === 'AE') return 'DUBAI';
      if (['US', 'CA'].includes(code)) return 'ISNA';
    }
    return 'MWL';
  };

  // Helper to get initial Asr method based on location
  const getInitialAsrMethod = () => {
    if (currentSettings?.asrMethod) return currentSettings.asrMethod;
    if (currentLocation) {
      const code = currentLocation.countryCode?.toUpperCase();
      if (['PK', 'IN', 'BD', 'EG'].includes(code)) return 'hanafi';
    }
    return 'standard';
  };

  const [calcMethod, setCalcMethod] = useState(getInitialCalcMethod());
  const [asrMethod, setAsrMethod] = useState(getInitialAsrMethod());
  const [timeFormat, setTimeFormat] = useState(currentSettings?.timeFormat || '12h');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [asrModalVisible, setAsrModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const onSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (user) {
        await profileService.savePrayerSettings(user.id, {
          calculation_method: calcMethod,
          asr_method: asrMethod.toUpperCase() as 'STANDARD' | 'HANAFI',
          time_format: timeFormat as '12h' | '24h',
        });

        await profileService.updateProfile(user.id, {
          onboarding_step: 'notifications'
        });

        setPrayerSettings({
          calculationMethod: calcMethod,
          asrMethod: asrMethod as 'standard' | 'hanafi',
          timeFormat: timeFormat as '12h' | '24h',
        });
        router.push('/onboarding/notifications');
      }
    } catch (error) {
      console.error('Error saving prayer settings:', error);
      setErrorModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout
      title="Prayer time settings"
      subtitle="We’ll use these settings to calculate your daily prayer times. You can update them later in Profile."
      scrollEnabled={false}
    >
      <View style={styles.selectorsContainer}>
        <SelectorRow 
          label="Calculation method"
          value={calcMethod}
          options={CALCULATION_METHODS}
          onPress={() => setCalcModalVisible(true)}
          helper={currentLocation?.countryCode === 'PK' ? 'Recommended for your location' : undefined}
        />

        <SelectorRow 
          label="Asr method"
          value={asrMethod}
          options={ASR_METHODS}
          onPress={() => setAsrModalVisible(true)}
        />

        <SelectorRow 
          label="Time format"
          value={timeFormat}
          options={TIME_FORMATS}
          onPress={() => setTimeModalVisible(true)}
        />

        <View style={{ height: 12 }} />

        <AppButton 
          title="Continue" 
          onPress={onSubmit} 
          loading={isSubmitting}
          icon={<ArrowRight size={20} color="#f4f1ea" strokeWidth={3} />}
          iconPosition="right"
        />

        <View style={{ height: 10 }} />
      </View>

      {/* Selection Sheets */}
      <SelectorSheet 
        visible={calcModalVisible}
        title="Choose calculation method"
        options={CALCULATION_METHODS}
        selectedValue={calcMethod}
        onSelect={(val: string) => {
          setCalcMethod(val);
          setCalcModalVisible(false);
        }}
        onClose={() => setCalcModalVisible(false)}
        maxHeight="75%"
      />

      <SelectorSheet 
        visible={asrModalVisible}
        title="Choose Asr method"
        options={ASR_METHODS}
        selectedValue={asrMethod}
        onSelect={(val: string) => {
          setAsrMethod(val as 'standard' | 'hanafi');
          setAsrModalVisible(false);
        }}
        onClose={() => setAsrModalVisible(false)}
      />

      <SelectorSheet 
        visible={timeModalVisible}
        title="Choose time format"
        options={TIME_FORMATS}
        selectedValue={timeFormat}
        onSelect={(val: string) => {
          setTimeFormat(val as '12h' | '24h');
          setTimeModalVisible(false);
        }}
        onClose={() => setTimeModalVisible(false)}
      />

      <AppModal 
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title="We couldn’t save your settings"
        message="Please try again, or continue with default settings."
        confirmLabel="Try Again"
        onConfirm={onSubmit}
      />
    </OnboardingLayout>
  );
}

// --- Sub-components moved outside to preserve state and animations ---

const SelectorRow = ({ label, value, options, onPress, helper }: any) => {
  const selectedOption = options.find((o: any) => o.value === value);
  return (
    <View style={styles.selectorWrapper}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <AppCard variant="outline" style={styles.selectorCard}>
          <View style={styles.selectorTextContent}>
            <Text style={styles.selectorTitle}>{selectedOption?.label}</Text>
            <Text style={styles.selectorHelper}>{helper || selectedOption?.description}</Text>
          </View>
          <ChevronDown size={20} color="#0f172a" opacity={0.4} />
        </AppCard>
      </TouchableOpacity>
    </View>
  );
};

const OptionItem = ({ label, description, selected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <AppCard variant={selected ? 'solid' : 'outline'} style={styles.optionItemCard}>
      <View style={styles.optionTextContent}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
          {label}
        </Text>
        <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>
          {description}
        </Text>
      </View>
      {selected && <Check size={20} color="#f4f1ea" strokeWidth={3} />}
    </AppCard>
  </TouchableOpacity>
);

const SelectorSheet = ({ visible, title, options, selectedValue, onSelect, onClose, maxHeight }: any) => {
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const [shouldRender, setShouldRender] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setShouldRender(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (shouldRender && !isClosing) {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShouldRender(false);
      setIsClosing(false);
      onClose?.();
    });
  };

  const handleSelect = (val: string) => {
    if (isClosing) return;
    onSelect(val);
  };

  if (!shouldRender) return null;

  return (
    <Modal 
      transparent 
      visible={shouldRender} 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => !isClosing && onClose()}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>
        <Animated.View 
          style={[
            styles.bottomSheet, 
            { 
              transform: [{ translateY: slideAnim }], 
              maxHeight: maxHeight || '80%',
              paddingBottom: 40,
            }
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            style={maxHeight ? { flexGrow: 0 } : {}}
          >
            {options.map((m: any) => (
              <OptionItem 
                key={m.value}
                label={m.label}
                description={m.description}
                selected={selectedValue === m.value}
                onPress={() => handleSelect(m.value)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  selectorsContainer: {
    gap: 12,
    marginTop: 0,
  },
  selectorWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  sectionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  selectorTextContent: {
    flex: 1,
  },
  selectorTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  selectorHelper: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  optionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  optionTextContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionTitleSelected: {
    color: '#f4f1ea',
  },
  optionDesc: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  optionDescSelected: {
    color: 'rgba(244, 241, 234, 0.6)',
  },
  helperSection: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  helperText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#f4f1ea',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingTop: 16,
    paddingBottom: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 20,
    color: '#333333',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
});
