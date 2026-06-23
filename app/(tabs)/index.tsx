import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useDevStore } from '@/features/dev/store/useDevStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { prayerService } from '@/features/prayers/services/prayer.service';
import { useHomePrayerTimes } from '@/features/prayers/hooks/useHomePrayerTimes';
import { usePrayerLog } from '@/features/prayers/hooks/usePrayerLog';
import { usePrayerCountdown, getPrayerDisplayStatuses } from '@/features/prayers/hooks/usePrayerCountdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PremiumHeroCard } from '@/components/home/PremiumHeroCard';
import { PremiumPrayerList } from '@/components/home/PremiumPrayerList';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useDateStore } from '@/features/prayers/store/useDateStore';
import { usePrayerLogForDate } from '@/features/prayers/hooks/usePrayerLogForDate';
import { usePrayerTimesForDate } from '@/features/prayers/hooks/usePrayerTimesForDate';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PrayerLog, PrayerKey } from '@/features/prayers/types';

interface PastDateSummaryCardProps {
  date: string;
  log: PrayerLog | null;
}

const PastDateSummaryCard = ({ date, log }: PastDateSummaryCardProps) => {
  const router = useRouter();
  
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch (e) {
      return date;
    }
  }, [date]);

  const stats = useMemo(() => {
    if (!log) {
      return { completed: 0, missed: 0, missedList: [] as string[] };
    }
    const keys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let completed = 0;
    let missed = 0;
    const missedList: string[] = [];
    
    keys.forEach(k => {
      const status = log[`${k}_status` as keyof PrayerLog];
      if (status === 'prayed' || status === 'qaza_prayed') {
        completed++;
      } else if (status === 'not_completed') {
        missed++;
        missedList.push(k.charAt(0).toUpperCase() + k.slice(1));
      }
    });

    return { completed, missed, missedList };
  }, [log]);

  const { completed, missed, missedList } = stats;

  const missedText = useMemo(() => {
    if (missedList.length === 0) return '';
    if (missedList.length === 1) return `${missedList[0]} needs Qaza`;
    if (missedList.length === 2) return `${missedList[0]} and ${missedList[1]} need Qaza`;
    return `${missedList.slice(0, -1).join(', ')}, and ${missedList[missedList.length - 1]} need Qaza`;
  }, [missedList]);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryDate}>{formattedDate}</Text>
        <TouchableOpacity 
          style={styles.calendarIconButton} 
          onPress={() => router.push('/calendar' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={20} color="#c49b66" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {missed === 0 && log ? (
        <View style={styles.completeContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text style={styles.completeText}>All prayers completed</Text>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>
      )}

      {missed > 0 && (
        <Text style={styles.missedDetailsText}>{missedText}</Text>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = '#f4f1ea';
  
  const { session, user, isFullySetup } = useAuth();
  const [showCelebration, setShowCelebration] = React.useState(false);

  // 1. Verify and extract timezone
  const { location, prayerSettings, isLoading: settingsLoading } = useProfileSettings();
  const timezone = location?.timezone;
  const timeFormat = prayerSettings?.time_format || '12h';

  const mockTime = useDevStore(s => s.mockTime);
  const [nowState, setNowState] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNowState(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayNow = mockTime ?? nowState;

  // 2. Calculate displayDateStr from displayNow in user timezone
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  let displayDateStr = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(displayNow);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    displayDateStr = `${y}-${m}-${d}`;
  } catch (e) {
    const y = displayNow.getFullYear();
    const m = String(displayNow.getMonth() + 1).padStart(2, '0');
    const d = String(displayNow.getDate()).padStart(2, '0');
    displayDateStr = `${y}-${m}-${d}`;
  }

  // 3. Connect to selected date store
  const selectedDate = useDateStore((s) => s.selectedDate);
  const resetToToday = useDateStore((s) => s.resetToToday);
  const isToday = selectedDate === displayDateStr;

  // 4. Fetch Today's data (only if isToday)
  const { data: realTodayTimes } = useQuery({
    queryKey: ['todayPrayers', user?.id],
    queryFn: () => prayerService.getTodayPrayers(),
    enabled: !!session?.access_token && !!user?.id && isFullySetup && isToday,
  });

  const realTodayDate = realTodayTimes?.prayer_date || realTodayTimes?.date;
  const isHomePrayerReady =
    !!session?.access_token &&
    !!user?.id &&
    isFullySetup &&
    !!timezone &&
    !settingsLoading;

  const isPreviewMode = __DEV__ && isHomePrayerReady && !!realTodayDate && displayDateStr !== realTodayDate;

  // Conditional hook fetching based on selected date
  const { 
    data: todayTimes, 
    isLoading: todayTimesLoading, 
    isFetching: todayTimesFetching, 
    refetch: refetchTodayTimes 
  } = useHomePrayerTimes(displayNow, timezone);

  const { 
    data: todayLog, 
    isLoading: todayLogLoading, 
    isFetching: todayLogFetching, 
    refetch: refetchTodayLog 
  } = usePrayerLog(isToday && !isPreviewMode);

  // Fetch Past/Specific date data (only if !isToday)
  const {
    data: dateTimes,
    isLoading: dateTimesLoading,
    isFetching: dateTimesFetching,
    refetch: refetchDateTimes,
  } = usePrayerTimesForDate(selectedDate, !isToday);

  const {
    data: dateLog,
    isLoading: dateLogLoading,
    isFetching: dateLogFetching,
    refetch: refetchDateLog,
  } = usePrayerLogForDate(selectedDate, !isToday);

  // Unify variables
  const prayerTimes = isToday ? todayTimes : dateTimes;
  const prayerLog = isToday ? todayLog : dateLog;
  const timesLoading = isToday ? todayTimesLoading : dateTimesLoading;
  const logLoading = isToday ? todayLogLoading : dateLogLoading;
  const timesFetching = isToday ? todayTimesFetching : dateTimesFetching;
  const logFetching = isToday ? todayLogFetching : dateLogFetching;
  const refetchTimes = isToday ? refetchTodayTimes : refetchDateTimes;
  const refetchLog = isToday ? refetchTodayLog : refetchDateLog;

  const prayerTimesDate = prayerTimes?.prayer_date || prayerTimes?.date;
  const displayPrayerLog = !isPreviewMode && prayerLog?.prayer_date === prayerTimesDate ? (prayerLog || null) : null;

  const isDateMismatched = isToday && !!displayDateStr && !!prayerTimesDate && prayerTimesDate !== displayDateStr;
  const isDevPreview = __DEV__ && isHomePrayerReady && !!displayDateStr && !!realTodayDate && displayDateStr !== realTodayDate;

  const isLoading = !isHomePrayerReady || timesLoading || (logLoading && isToday && !isPreviewMode) || isDateMismatched;
  const isFetching = timesFetching || logFetching;
  const hasError = !isLoading && !prayerTimes;

  const countdown = usePrayerCountdown(prayerTimes || null, displayPrayerLog, displayNow);

  const onRefresh = React.useCallback(() => {
    if (!session || !user || !isFullySetup) return;
    refetchTimes();
    refetchLog();
  }, [session, user, isFullySetup, refetchTimes, refetchLog]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Viewing past date banner */}
      {!isToday && !isLoading && (
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Ionicons name="calendar-outline" size={16} color="#78716c" style={styles.bannerIcon} />
            <Text style={styles.bannerText}>Viewing past date: {selectedDate}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bannerButton} 
            onPress={resetToToday}
            activeOpacity={0.7}
          >
            <Text style={styles.bannerButtonText}>Back to Today</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Static Hero Section */}
      {!hasError && (
        <View style={styles.fixedHeader}>
          {isLoading ? (
            <>
              <View style={styles.heroSkeletonWrapper}>
                <View style={styles.heroSkeleton} />
              </View>
              <View style={styles.listHeader}>
                <View style={styles.skeletonTitle} />
                <View style={[styles.skeletonTitle, { width: 80 }]} />
              </View>
            </>
          ) : (
            <>
              {isToday ? (
                <PremiumHeroCard 
                  prayerTimes={prayerTimes || null} 
                  countdown={countdown} 
                  timeFormat={timeFormat}
                />
              ) : (
                <PastDateSummaryCard 
                  date={selectedDate} 
                  log={displayPrayerLog || null} 
                />
              )}
              <View style={styles.listHeader}>
                <Text style={[styles.title, { color: '#1a1a1a' }]}>
                  {isToday ? "Today's Prayers" : "Prayer Log"}
                </Text>
                {isToday && (
                  <TouchableOpacity 
                    style={styles.headerCalendarButton}
                    onPress={() => router.push('/calendar' as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={22} color="#1c1917" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* Scrollable List Section */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isFetching && !!prayerTimes && !showCelebration} 
            onRefresh={onRefresh} 
            tintColor={Colors[colorScheme].tint}
          />
        }
      >
        {hasError ? (
          <View style={styles.errorContainer}>
            <View style={[styles.errorCard, { backgroundColor: Colors[colorScheme].card }]}>
              <Text style={[styles.errorTitle, { color: Colors[colorScheme].text }]}>
                We couldn&apos;t load prayer times
              </Text>
              <Text style={[styles.errorSubtitle, { color: Colors[colorScheme].text, opacity: 0.6 }]}>
                Please check your connection and try again.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Text style={[styles.retryText, { color: Colors[colorScheme].tint }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isLoading ? (
          <View style={styles.listSection}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : (
          <View style={styles.listSection}>
            <PremiumPrayerList 
              prayerTimes={prayerTimes || null} 
              prayerLog={displayPrayerLog || null} 
              displayNow={displayNow}
              timeFormat={timeFormat}
              hideHeader={true}
              showCelebration={showCelebration}
              onShowCelebration={setShowCelebration}
              isDevPreview={isDevPreview}
              selectedDate={selectedDate}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    backgroundColor: '#f4f1ea',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listSection: {
    paddingHorizontal: 20,
    marginTop: 0,
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: -4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  heroSkeletonWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  heroSkeleton: {
    height: 220,
    borderRadius: 32,
    backgroundColor: '#e2e8f0',
    opacity: 0.5,
  },
  skeletonTitle: {
    width: 150,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    opacity: 0.5,
  },
  skeletonRow: {
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
    opacity: 0.5,
  },
  errorContainer: {
    padding: 20,
    marginTop: 20,
  },
  errorCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e7e5e4',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerIcon: {},
  bannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#44403c',
  },
  bannerButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#292524',
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fffdfa',
  },
  headerCalendarButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  summaryCard: {
    backgroundColor: '#1c1917',
    borderRadius: 32,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDate: {
    color: '#fffdfa',
    fontSize: 22,
    fontWeight: '800',
  },
  calendarIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#22c55e',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#a8a29e',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  completeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  completeText: {
    color: '#fffdfa',
    fontSize: 16,
    fontWeight: '700',
  },
  missedDetailsText: {
    color: '#a8a29e',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    lineHeight: 18,
  },
});
