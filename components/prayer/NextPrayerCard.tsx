import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TodayPrayerTimes, PrayerLog, PrayerKey } from '@/types/prayer';

interface NextPrayerCardProps {
  prayerTimes?: TodayPrayerTimes | null;
  prayerLog?: PrayerLog | null;
  countdown: {
    nextPrayerKey: PrayerKey | null;
    timeLeft: string;
    progress: number;
  };
}

export const NextPrayerCard = ({ prayerTimes, prayerLog, countdown }: NextPrayerCardProps) => {
  const charcoal = '#1a1a1a';
  const cream = '#f4f1ea';
  const gold = '#c5a059';

  const nextPrayerName = countdown.nextPrayerKey 
    ? countdown.nextPrayerKey.charAt(0).toUpperCase() + countdown.nextPrayerKey.slice(1)
    : 'Completed';

  const nextPrayerTime = countdown.nextPrayerKey && prayerTimes
    ? new Date(prayerTimes[countdown.nextPrayerKey]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: charcoal }]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: gold }]}>NEXT PRAYER</Text>
          <Text style={[styles.timeLabel, { color: cream }]}>{nextPrayerTime}</Text>
        </View>

        <Text style={[styles.prayerName, { color: cream }]}>{nextPrayerName}</Text>
        
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdown, { color: gold }]}>{countdown.timeLeft}</Text>
          <Text style={[styles.remaining, { color: cream, opacity: 0.6 }]}>remaining</Text>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${countdown.progress * 100}%`, backgroundColor: gold }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    minHeight: 220,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  prayerName: {
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 10,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  countdown: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  remaining: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
