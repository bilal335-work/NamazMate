import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { UserX, AlertTriangle } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePartnerProfile } from '@/features/duo/hooks/usePartnerProfile';
import { usePartnerPrayerLog } from '@/features/duo/hooks/usePartnerPrayerLog';
import { usePrayerLog } from '@/features/prayers/hooks/usePrayerLog';
import { useSendReminder } from '@/features/duo/hooks/useSendReminder';
import { useRemovePartner } from '@/features/duo/hooks/useRemovePartner';
import { useDuoHistory } from '@/features/duo/hooks/useDuoHistory';
import { DuoSummaryCard } from './DuoSummaryCard';
import { DuoPrayerComparisonRow } from './DuoPrayerComparisonRow';
import { SendReminderSheet } from './SendReminderSheet';
import { DuoHistoryTabs } from './DuoHistoryTabs';
import { DuoHistorySummary } from './DuoHistorySummary';
import { Pair } from '@/features/duo/types';
import { PrayerLog, PrayerKey } from '@/features/prayers/types';

interface DuoDashboardProps {
  pair: Pair;
  onRefresh: () => void;
}

export const DuoDashboard: React.FC<DuoDashboardProps> = ({ pair, onRefresh }) => {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];

  const partnerId = pair.user_a_id === user?.id ? pair.user_b_id : pair.user_a_id;
  const { data: partner } = usePartnerProfile(partnerId);
  const { data: userLog } = usePrayerLog();
  const { data: partnerLog } = usePartnerPrayerLog(partnerId, today);
  
  const [activePeriod, setActivePeriod] = useState<7 | 30 | 0>(7);
  const { data: historyLogs } = useDuoHistory(partnerId, pair.pair_start_date, activePeriod);

  const reminderSheetRef = useRef<BottomSheet>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);

  const { mutate: sendReminder, isPending: sendingReminder } = useSendReminder();
  const { mutate: removePartner } = useRemovePartner();

  const handleSendReminder = (message: string) => {
    if (!selectedPrayer) return;
    sendReminder({
      pairId: pair.id,
      receiverId: partnerId,
      prayerKey: selectedPrayer,
      message,
    }, {
      onSuccess: () => {
        reminderSheetRef.current?.close();
        Alert.alert('Success', 'Reminder sent to your partner!');
      },
      onError: (error: any) => {
        Alert.alert('Reminder Cooldown', error.message || 'Please wait before sending another reminder.');
      }
    });
  };

  const handleRemovePartner = () => {
    Alert.alert(
      'Remove Partner',
      'Are you sure you want to end this Duo partnership? You will lose access to shared history immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removePartner(pair.id)
        },
      ]
    );
  };

  if (!partner) return null;

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={styles.flex}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Duo Dashboard</Text>
          <TouchableOpacity 
            onPress={handleRemovePartner}
            accessibilityRole="button"
            accessibilityLabel="Remove Partner"
          >
            <UserX size={24} color={colors.text + '40'} />
          </TouchableOpacity>
        </View>

        {/* Today Summary */}
        <DuoSummaryCard 
          userScore={userLog?.daily_score || 0}
          partnerScore={partnerLog?.daily_score || 0}
          partner={partner}
        />

        {/* Today Comparison */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today&apos;s Progress</Text>
            <View style={styles.legend}>
              <Text style={[styles.legendText, { color: colors.text + '40' }]}>You</Text>
              <View style={[styles.legendDivider, { backgroundColor: colors.text + '10' }]} />
              <Text style={[styles.legendText, { color: colors.text + '40' }]}>Partner</Text>
            </View>
          </View>
          <View style={[styles.comparisonList, { backgroundColor: colors.background, borderRadius: 16 }]}>
            {prayers.map((p) => {
              const prayer = p as PrayerKey;
              const statusKey = `${prayer}_status` as keyof PrayerLog;
              return (
                <DuoPrayerComparisonRow 
                  key={prayer}
                  prayerName={prayer}
                  userStatus={(userLog?.[statusKey] as any) || 'locked'}
                  partnerStatus={(partnerLog?.[statusKey] as any) || 'locked'}
                  onSendReminder={() => {
                    setSelectedPrayer(prayer);
                    reminderSheetRef.current?.expand();
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Partnership History</Text>
          <DuoHistoryTabs 
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
          />
          {historyLogs ? (
            <DuoHistorySummary 
              logs={historyLogs}
              userId={user?.id || ''}
              partnerId={partnerId}
              partnerName={partner.full_name}
            />
          ) : (
            <Text style={{ color: colors.text + '40', textAlign: 'center' }}>Loading history...</Text>
          )}
        </View>

        <View style={styles.footer}>
          <AlertTriangle size={16} color={colors.text + '20'} />
          <Text style={[styles.footerText, { color: colors.text + '20' }]}>
            Partner history is only visible from {new Date(pair.pair_start_date).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      <SendReminderSheet 
        sheetRef={reminderSheetRef}
        prayerName={selectedPrayer || ''}
        onSend={handleSendReminder}
        loading={sendingReminder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  comparisonList: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#00000005',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  }
});
