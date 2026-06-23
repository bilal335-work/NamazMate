import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AppCard } from '@/components/ui/AppCard';

interface DuoHistorySummaryProps {
  logs: any[];
  userId: string;
  partnerId: string;
  partnerName: string;
}

export const DuoHistorySummary: React.FC<DuoHistorySummaryProps> = ({
  logs,
  userId,
  partnerId,
  partnerName,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const calculateStats = (id: string) => {
    const userLogs = logs.filter(l => l.user_id === id);
    const totalDays = [...new Set(userLogs.map(l => l.prayer_date))].length;
    const totalScore = userLogs.reduce((acc, curr) => acc + (curr.daily_score || 0), 0);
    
    // Count qazas (summary only for partner, but we calculate it here)
    let qazas = 0;
    userLogs.forEach(log => {
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
        const status = log[`${p}_status`];
        if (status === 'qaza_prayed' || status === 'qaza_available') {
          qazas++;
        }
      });
    });

    return { totalDays, totalScore, qazas };
  };

  const userStats = calculateStats(userId);
  const partnerStats = calculateStats(partnerId);

  const StatBox = ({ label, value, name }: { label: string; value: string | number; name: string }) => (
    <View style={styles.statBox}>
      <Text style={[styles.statLabel, { color: colors.text + '60' }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppCard style={styles.card}>
        <Text style={[styles.header, { color: colors.text }]}>You</Text>
        <View style={styles.statsRow}>
          <StatBox label="Score" value={userStats.totalScore.toFixed(1)} name="You" />
          <StatBox label="Qazas" value={userStats.qazas} name="You" />
          <StatBox label="Days" value={userStats.totalDays} name="You" />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={[styles.header, { color: colors.text }]}>{partnerName}</Text>
        <View style={styles.statsRow}>
          <StatBox label="Score" value={partnerStats.totalScore.toFixed(1)} name={partnerName} />
          <StatBox label="Qazas" value={partnerStats.qazas} name={partnerName} />
          <StatBox label="Days" value={partnerStats.totalDays} name={partnerName} />
        </View>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    padding: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    gap: 8,
  },
  statBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
