import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useDevStore } from '@/features/dev/store/useDevStore';
import { TodayPrayerTimes, PrayerLog, PrayerKey } from '@/features/prayers/types';
import { useMarkPrayer } from '@/features/prayers/hooks/useMarkPrayer';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatPrayerTime } from '@/utils/time';
import { getPrayerDisplayStatuses } from '@/features/prayers/hooks/usePrayerCountdown';
import { getPrayerDisplayName, canMarkJummahNow, isFridayInTimezone } from '@/utils/prayer';
import { SlideToMark } from './SlideToMark';
import { LockedPrayerCard } from './LockedPrayerCard';
import { Ionicons } from '@expo/vector-icons';
import { QazaConfirmModal } from '../prayer/QazaConfirmModal';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

interface PremiumPrayerListProps {
  prayerTimes?: TodayPrayerTimes | null;
  prayerLog?: PrayerLog | null;
  displayNow?: Date;
  timeFormat?: '12h' | '24h';
  hideHeader?: boolean;
  showCelebration?: boolean;
  onShowCelebration?: (visible: boolean) => void;
  isDevPreview?: boolean;
  selectedDate?: string;
}

export const PremiumPrayerList = ({ 
  prayerTimes, 
  prayerLog, 
  displayNow,
  timeFormat = '12h',
  hideHeader = false,
  showCelebration = false,
  onShowCelebration,
  isDevPreview = false,
  selectedDate
}: PremiumPrayerListProps) => {
  const { gender } = useAuth();
  const markMutation = useMarkPrayer();
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; prayerKey: PrayerKey | null; label: string }>({
    visible: false,
    prayerKey: null,
    label: '',
  });

  const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const triggerCelebration = () => {
    onShowCelebration?.(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleMark = (key: PrayerKey) => {
    if (isDevPreview) {
      Alert.alert('Preview Mode', 'Preview mode is active. Marking is disabled for this test date.');
      return;
    }
    triggerCelebration();
    markMutation.mutate({ prayerKey: key });
  };

  const openQazaModal = (key: PrayerKey, label: string) => {
    if (isDevPreview) {
      Alert.alert('Preview Mode', 'Preview mode is active. Marking is disabled for this test date.');
      return;
    }
    setConfirmModal({ visible: true, prayerKey: key, label });
  };

  const mockTime = useDevStore(s => s.mockTime);
  const now = displayNow ?? mockTime ?? new Date();

  // Determine if we are viewing the today view
  const timezone = prayerTimes?.timezone || 'Asia/Karachi';
  const todayDateStr = React.useMemo(() => {
    const tz = timezone;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(now);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      return `${y}-${m}-${d}`;
    } catch (e) {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }, [timezone, now]);

  const isToday = !selectedDate || selectedDate === todayDateStr;

  const confirmQaza = () => {
    if (confirmModal.prayerKey) {
      if (isDevPreview) {
        Alert.alert('Preview Mode', 'Preview mode is active. Marking is disabled for this test date.');
        return;
      }
      triggerCelebration();
      markMutation.mutate({ 
        prayerKey: confirmModal.prayerKey, 
        markType: 'qaza_prayed', 
        date: isToday ? undefined : selectedDate 
      });
      setConfirmModal({ visible: false, prayerKey: null, label: '' });
    }
  };

  const displayStatuses = getPrayerDisplayStatuses(
    prayerTimes || null,
    prayerLog || null,
    now
  );

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: '#1a1a1a' }]}>Today&apos;s Prayers</Text>
        </View>
      )}
      
      {prayerKeys.flatMap((key) => {
        const timeStr = formatPrayerTime(prayerTimes ? prayerTimes[key] : null, timeFormat);
        const status = displayStatuses[key];
        const markTime = prayerLog ? (prayerLog[`${key}_time` as keyof PrayerLog] as string) : null;
        
        const label = getPrayerDisplayName(key, {
          gender,
          date: prayerTimes?.prayer_date || prayerTimes?.date,
          timezone: prayerTimes?.timezone,
        });

        const completedTimeStr = markTime ? formatPrayerTime(markTime, timeFormat) : undefined;

        // Special handling for Dhuhr on past Fridays for male users
        const isPastFriday = !isToday && key === 'dhuhr' && gender === 'male' && isFridayInTimezone(prayerTimes?.prayer_date || prayerTimes?.date || '', prayerTimes?.timezone || 'Asia/Karachi');

        if (isPastFriday) {
          const jummahRow = (
            <View key="jummah_missed" style={styles.itemWrapper}>
              <View style={[styles.statusCard, styles.missingCard]}>
                <View style={styles.statusInfo}>
                  <View style={[styles.indicator, { backgroundColor: '#ef4444' }]} />
                  <View>
                    <Text style={[styles.statusLabel, { color: '#ef4444' }]}>Jummah</Text>
                    <Text style={[styles.statusText, { color: 'rgba(239, 68, 68, 0.75)' }]}>{timeStr} • Missed</Text>
                  </View>
                </View>
                <Ionicons name="close-circle" size={24} color="#ef4444" opacity={0.5} />
              </View>
            </View>
          );

          if (status === 'prayed') {
            return [
              <View key={key} style={styles.itemWrapper}>
                <SlideToMark 
                  prayerName="Jummah"
                  isCompleted={true}
                  completedTime={completedTimeStr}
                  onComplete={() => {}}
                />
              </View>
            ];
          }

          const dhuhrQazaRow = status === 'qaza_prayed' ? (
            <View key="dhuhr_qaza_completed" style={styles.itemWrapper}>
              <SlideToMark 
                prayerName="Dhuhr Qaza"
                isCompleted={true}
                completedTime={completedTimeStr}
                successLabel="Qaza Completed"
                onComplete={() => {}}
              />
            </View>
          ) : (
            <View key="dhuhr_qaza_available" style={styles.itemWrapper}>
              <View style={[styles.statusCard, styles.qazaCard]}>
                <View style={styles.statusInfo}>
                  <View style={[styles.indicator, { backgroundColor: '#f59e0b' }]} />
                  <View>
                    <Text style={styles.statusLabel}>Dhuhr Qaza</Text>
                    <Text style={styles.statusText}>{timeStr} • Qaza available</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.qazaButton} 
                  onPress={() => openQazaModal('dhuhr', 'Dhuhr Qaza')}
                  disabled={markMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qazaButtonText}>Qaza</Text>
                </TouchableOpacity>
              </View>
            </View>
          );

          return [jummahRow, dhuhrQazaRow];
        }

        switch (status) {
          case 'prayed':
            return [
              <View key={key} style={styles.itemWrapper}>
                <SlideToMark 
                  prayerName={label}
                  isCompleted={true}
                  completedTime={completedTimeStr}
                  onComplete={() => {}}
                />
              </View>
            ];
          
          case 'qaza_prayed':
            return [
              <View key={key} style={styles.itemWrapper}>
                <SlideToMark 
                  prayerName={label}
                  isCompleted={true}
                  completedTime={completedTimeStr}
                  successLabel="Qaza Completed"
                  onComplete={() => {}}
                />
              </View>
            ];

          case 'available':
            if (!isToday) {
              // Should not happen on past dates, but fallback if resolved so
              return [
                <View key={key} style={styles.itemWrapper}>
                  <View style={[styles.statusCard, styles.missingCard]}>
                    <View style={styles.statusInfo}>
                      <View style={[styles.indicator, { backgroundColor: '#ef4444' }]} />
                      <View>
                        <Text style={[styles.statusLabel, { color: '#ef4444' }]}>{label}</Text>
                        <Text style={[styles.statusText, { color: 'rgba(239, 68, 68, 0.75)' }]}>{timeStr} • Missed</Text>
                      </View>
                    </View>
                    <Ionicons name="close-circle" size={24} color="#ef4444" opacity={0.5} />
                  </View>
                </View>
              ];
            }
            const guard = canMarkJummahNow({
              prayerKey: key,
              gender,
              displayNow: now,
              timezone: prayerTimes?.timezone || 'Asia/Karachi',
              dateStr: prayerTimes?.prayer_date || prayerTimes?.date || '',
            });
            return [
              <View key={key} style={styles.itemWrapper}>
                <SlideToMark 
                  prayerName={label}
                  prayerTime={timeStr}
                  onComplete={() => handleMark(key)}
                  isBlocked={!guard.allowed}
                  blockedReason={guard.reason}
                />
              </View>
            ];

          case 'qaza_available':
            return [
              <View key={key} style={styles.itemWrapper}>
                <View style={[styles.statusCard, styles.qazaCard]}>
                  <View style={styles.statusInfo}>
                    <View style={[styles.indicator, { backgroundColor: '#f59e0b' }]} />
                    <View>
                      <Text style={styles.statusLabel}>{label}</Text>
                      <Text style={styles.statusText}>{timeStr} • Qaza available</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.qazaButton} 
                    onPress={() => openQazaModal(key, label)}
                    disabled={markMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.qazaButtonText}>Qaza</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ];

          case 'not_completed':
            return [
              <View key={key} style={styles.itemWrapper}>
                <View style={[styles.statusCard, styles.qazaCard]}>
                  <View style={styles.statusInfo}>
                    <View style={[styles.indicator, { backgroundColor: '#f59e0b' }]} />
                    <View>
                      <Text style={styles.statusLabel}>{label}</Text>
                      <Text style={styles.statusText}>{timeStr} • Missed (Qaza available)</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.qazaButton} 
                    onPress={() => openQazaModal(key, label)}
                    disabled={markMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.qazaButtonText}>Qaza</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ];

          case 'locked':
          default:
            return [
              <View key={key} style={styles.itemWrapper}>
                <LockedPrayerCard 
                  name={label}
                  time={timeStr}
                />
              </View>
            ];
        }
      })}

      <QazaConfirmModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, prayerKey: null, label: '' })}
        onConfirm={confirmQaza}
        prayerName={confirmModal.label}
        isPending={markMutation.isPending}
      />

      {showCelebration && (
        <Modal
          transparent
          visible={showCelebration}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => onShowCelebration?.(false)}
        >
          <View style={styles.modalContainer} pointerEvents="none">
            <LottieView
              source={require('../../assets/lottie/success.json')}
              style={styles.successLottie}
              autoPlay
              loop={false}
              resizeMode="contain"
              onAnimationFinish={() => onShowCelebration?.(false)}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  qazaCard: {
    backgroundColor: '#2d2d2d',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  missingCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fffdfa',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a29e',
    marginTop: 2,
  },
  qazaButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  qazaButtonText: {
    color: '#2d2d2d',
    fontSize: 14,
    fontWeight: '900',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  successLottie: {
    width: 450,
    height: 450,
  },
});
