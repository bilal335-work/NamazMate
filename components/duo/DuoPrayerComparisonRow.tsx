import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, AlertCircle, Bell } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrayerStatus } from '@/types/prayer';

interface DuoPrayerComparisonRowProps {
  prayerName: string;
  userStatus: PrayerStatus;
  partnerStatus: PrayerStatus;
  onSendReminder: () => void;
}

export const DuoPrayerComparisonRow: React.FC<DuoPrayerComparisonRowProps> = ({
  prayerName,
  userStatus,
  partnerStatus,
  onSendReminder,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getStatusIcon = (status: PrayerStatus) => {
    switch (status) {
      case 'prayed':
      case 'qaza_prayed':
        return <CheckCircle2 size={20} color={colors.primary} />;
      case 'qaza_available':
      case 'not_completed':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'available':
        return <Circle size={20} color={colors.text + '40'} />;
      default:
        return <Circle size={20} color={colors.text + '10'} />;
    }
  };

  const isPartnerPending = partnerStatus === 'available' || partnerStatus === 'qaza_available';

  return (
    <View style={[styles.container, { borderBottomColor: colors.text + '05' }]}>
      <Text style={[styles.prayerName, { color: colors.text }]}>{prayerName}</Text>
      
      <View style={styles.statusSection}>
        <View style={styles.statusBox}>
          {getStatusIcon(userStatus)}
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.text + '10' }]} />
        
        <View style={styles.statusBox}>
          {getStatusIcon(partnerStatus)}
        </View>
      </View>

      <View style={styles.actionSection}>
        {isPartnerPending && (
          <TouchableOpacity onPress={onSendReminder} style={styles.reminderButton}>
            <Bell size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prayerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statusBox: {
    width: 40,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  actionSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  reminderButton: {
    padding: 4,
  }
});
