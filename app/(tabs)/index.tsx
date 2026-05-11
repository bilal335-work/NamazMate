import React from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTodayPrayers } from '@/features/prayers/hooks/useTodayPrayers';
import { usePrayerLog } from '@/features/prayers/hooks/usePrayerLog';
import { usePrayerCountdown } from '@/features/prayers/hooks/usePrayerCountdown';
import { NextPrayerCard } from '@/features/prayers/components/NextPrayerCard';
import { TodayPrayerList } from '@/features/prayers/components/TodayPrayerList';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;
  
  const { data: prayerTimes, isLoading: timesLoading, refetch: refetchTimes } = useTodayPrayers();
  const { data: prayerLog, isLoading: logLoading, refetch: refetchLog } = usePrayerLog();
  const countdown = usePrayerCountdown(prayerTimes || null);

  const onRefresh = React.useCallback(() => {
    refetchTimes();
    refetchLog();
  }, [refetchTimes, refetchLog]);

  const isLoading = timesLoading || logLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <NextPrayerCard 
          prayerTimes={prayerTimes} 
          prayerLog={prayerLog} 
          countdown={countdown} 
        />
        
        <View style={styles.listSection}>
          <TodayPrayerList 
            prayerTimes={prayerTimes} 
            prayerLog={prayerLog} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  listSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
});
