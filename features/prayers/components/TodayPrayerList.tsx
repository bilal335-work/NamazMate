import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { TodayPrayerTimes, PrayerLog, PrayerKey } from '@/types/prayer';
import { useMarkPrayer } from '@/features/prayers/hooks/useMarkPrayer';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { Ionicons } from '@expo/vector-icons';

interface TodayPrayerListProps {
  prayerTimes?: TodayPrayerTimes | null;
  prayerLog?: PrayerLog | null;
}

export const TodayPrayerList = ({ prayerTimes, prayerLog }: TodayPrayerListProps) => {
  const { data: profile } = useProfile();
  const markMutation = useMarkPrayer();
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; prayerKey: PrayerKey | null }>({
    visible: false,
    prayerKey: null,
  });

  const charcoal = '#1a1a1a';
  const cream = '#f4f1ea';
  const gold = '#c5a059';
  const emerald = '#2e7d32';
  const red = '#c62828';

  const isFriday = new Date().getDay() === 5;
  const isMale = profile?.gender === 'male';

  const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prayed': return emerald;
      case 'qaza_prayed': return emerald;
      case 'available': return gold;
      case 'qaza_available': return red;
      case 'locked': return '#666';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prayed': return 'checkmark-circle';
      case 'qaza_prayed': return 'checkmark-circle-outline';
      case 'available': return 'radio-button-on';
      case 'qaza_available': return 'alert-circle';
      case 'locked': return 'lock-closed';
      default: return 'help-circle';
    }
  };

  const handleMark = (key: PrayerKey) => {
    setConfirmModal({ visible: true, prayerKey: key });
  };

  const confirmMark = async () => {
    if (confirmModal.prayerKey) {
      await markMutation.mutateAsync(confirmModal.prayerKey);
      setConfirmModal({ visible: false, prayerKey: null });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: charcoal }]}>Today's Prayers</Text>
      
      {prayerKeys.map((key) => {
        const timeStr = prayerTimes ? new Date(prayerTimes[key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const status = prayerLog ? (prayerLog[`${key}_status` as keyof PrayerLog] as string) : 'locked';
        
        let label = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === 'dhuhr' && isFriday && isMale) {
          label = 'Jummah';
        }

        const canMark = status === 'available' || status === 'qaza_available';

        return (
          <View key={key} style={styles.row}>
            <View style={styles.leftInfo}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
              <View>
                <Text style={[styles.prayerLabel, { color: charcoal }]}>{label}</Text>
                <Text style={styles.timeText}>{timeStr}</Text>
              </View>
            </View>

            <View style={styles.rightAction}>
              {status === 'prayed' || status === 'qaza_prayed' ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={16} color={emerald} />
                  <Text style={[styles.completedText, { color: emerald }]}>
                    {status === 'prayed' ? 'Done' : 'Qaza Done'}
                  </Text>
                </View>
              ) : canMark ? (
                <TouchableOpacity 
                  style={[styles.markButton, { backgroundColor: charcoal }]}
                  onPress={() => handleMark(key)}
                  disabled={markMutation.isPending}
                >
                  <Text style={[styles.markButtonText, { color: cream }]}>Mark</Text>
                </TouchableOpacity>
              ) : (
                <Ionicons name={getStatusIcon(status) as any} size={24} color="#ccc" />
              )}
            </View>
          </View>
        );
      })}

      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cream }]}>
            <Text style={styles.modalTitle}>Confirm Prayer</Text>
            <Text style={styles.modalText}>
              Are you sure you want to mark {confirmModal.prayerKey} as completed? This cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setConfirmModal({ visible: false, prayerKey: null })}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: charcoal }]}
                onPress={confirmMark}
                disabled={markMutation.isPending}
              >
                {markMutation.isPending ? (
                  <ActivityIndicator color={cream} />
                ) : (
                  <Text style={[styles.confirmText, { color: cream }]}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  prayerLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  rightAction: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  markButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  markButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
