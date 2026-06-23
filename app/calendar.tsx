import React, { useState, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useDateStore } from '@/features/prayers/store/useDateStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/services/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

interface DayCellProps {
  date: any;
  state: 'disabled' | 'today' | '';
  marking: any;
  onDayPress: (date: any) => void;
}

function DayCell({ date, state, marking, onDayPress }: DayCellProps) {
  const isDisabled = state === 'disabled';
  const isToday = state === 'today';
  const isSelected = marking?.selected === true;
  const status = marking?.status; // 'complete' | 'missed' | undefined

  let borderColor = 'transparent';
  let bgColor = 'transparent';
  let textColor = '#1c1917';

  if (isDisabled) {
    textColor = '#d6d3d1';
  } else if (isSelected) {
    bgColor = '#c49b66';
    textColor = '#1c1917';
    borderColor = 'transparent';
  } else if (isToday) {
    borderColor = '#c49b66';
    textColor = '#c49b66';
  } else if (status === 'complete') {
    borderColor = '#22c55e';
  } else if (status === 'missed') {
    borderColor = '#f59e0b';
  }


  return (
    <TouchableOpacity
      onPress={() => !isDisabled && onDayPress(date)}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: borderColor !== 'transparent' ? 2 : 0,
        borderColor,
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: isSelected || isToday ? '700' : '500',
        color: textColor,
      }}>
        {date.day}
      </Text>
    </TouchableOpacity>
  );
}

const CalendarComponent = Calendar as any;

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const calendarRef = useRef<any>(null);
  
  const selectedDate = useDateStore((s) => s.selectedDate);
  const setSelectedDate = useDateStore((s) => s.setSelectedDate);

  // Default to the currently selected date's month
  const initialMonth = selectedDate.substring(0, 7); // "YYYY-MM"
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Compute boundaries
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const signupDateStr = useMemo(() => {
    if (!user?.created_at) return '';
    const date = new Date(user.created_at);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [user?.created_at]);

  const { data: earliestLog } = useQuery({
    queryKey: ['earliestLog', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('prayer_logs')
        .select('prayer_date')
        .eq('user_id', user.id)
        .order('prayer_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const minDate = useMemo(() => {
    const signupDate = signupDateStr;
    const earliestLogDate = earliestLog?.prayer_date ?? signupDate;
    return earliestLogDate < signupDate ? earliestLogDate : signupDate;
  }, [signupDateStr, earliestLog]);

  // Fetch logs for the visible month
  const { data: monthLogs, isLoading } = useQuery({
    queryKey: ['monthLogs', user?.id, visibleMonth],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const firstDay = `${visibleMonth}-01`;
      const [year, month] = visibleMonth.split('-').map(Number);
      const lastDayDate = new Date(year, month, 0);
      const lastDay = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('prayer_logs')
        .select('prayer_date, fajr_status, dhuhr_status, asr_status, maghrib_status, isha_status')
        .eq('user_id', user.id)
        .gte('prayer_date', firstDay)
        .lte('prayer_date', lastDay);

      if (error) {
        console.error('[CalendarScreen] Error fetching month logs:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Calculate marked dates
  const markedDates = useMemo(() => {
    const markings: Record<string, any> = {};

    if (monthLogs) {
      monthLogs.forEach((log) => {
        const dateStr = log.prayer_date;
        const statuses = [
          log.fajr_status,
          log.dhuhr_status,
          log.asr_status,
          log.maghrib_status,
          log.isha_status,
        ];

        const hasMissed = statuses.some((s) => s === 'not_completed');
        const isComplete = !hasMissed && statuses.every(
          (s) => s === 'prayed' || s === 'qaza_prayed'
        );

        if (isComplete) {
          markings[dateStr] = {
            status: 'complete',
            selected: false,
          };
        } else if (hasMissed) {
          markings[dateStr] = {
            status: 'missed',
            selected: false,
          };
        }
      });
    }

    // Highlight the selected date (only if it is not today)
    if (selectedDate !== todayStr) {
      if (markings[selectedDate]) {
        markings[selectedDate] = {
          ...markings[selectedDate],
          selected: true,
        };
      } else {
        markings[selectedDate] = {
          selected: true,
        };
      }
    }

    return markings;
  }, [monthLogs, selectedDate, todayStr]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    router.back();
  }, [setSelectedDate, router]);

  const signupYear = useMemo(() => {
    if (!signupDateStr) return new Date().getFullYear();
    return parseInt(signupDateStr.split('-')[0], 10);
  }, [signupDateStr]);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= signupYear; y--) {
      list.push(y);
    }
    return list;
  }, [signupYear, currentYear]);

  const goToPrevMonth = useCallback(() => {
    const [year, month] = visibleMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setVisibleMonth(`${y}-${m}`);
  }, [visibleMonth]);

  const goToNextMonth = useCallback(() => {
    const [year, month] = visibleMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setVisibleMonth(`${y}-${m}`);
  }, [visibleMonth]);

  const handleYearSelect = (selectedYear: number) => {
    setShowYearPicker(false);
    const [, currentMonthVal] = visibleMonth.split('-');
    setVisibleMonth(`${selectedYear}-${currentMonthVal}`);
  };

  const renderCustomHeader = () => {
    const formattedHeader = (() => {
      try {
        const [y, m] = visibleMonth.split('-').map(Number);
        const dObj = new Date(y, m - 1, 15);
        return dObj.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      } catch (e) {
        return visibleMonth;
      }
    })();

    return (
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity 
          onPress={goToPrevMonth}
          style={styles.headerArrowButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#c49b66" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setShowYearPicker(true)}
          style={styles.headerTitleButton}
          activeOpacity={0.7}
        >
          <Text style={styles.customHeaderTitle}>{formattedHeader}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={goToNextMonth}
          style={styles.headerArrowButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color="#c49b66" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1c1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer History</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Calendar Area */}
      <View style={styles.calendarContainer}>
        <CalendarComponent
          ref={calendarRef}
          current={visibleMonth}
          dayComponent={({ date, state, marking }: any) => (
            <DayCell 
              date={date} 
              state={state} 
              marking={marking} 
              onDayPress={handleDayPress} 
            />
          )}
          onMonthChange={(month: any) => {
            const yearStr = month.year;
            const monthStr = String(month.month).padStart(2, '0');
            setVisibleMonth(`${yearStr}-${monthStr}`);
          }}
          markedDates={markedDates}
          minDate={minDate}
          maxDate={todayStr}
          hideArrows={true}
          renderHeader={renderCustomHeader}
          enableSwipeMonths={true}
          horizontal={true}
          pagingEnabled={true}
          theme={{
            backgroundColor: '#fffdfa',
            calendarBackground: '#fffdfa',
            textSectionTitleColor: '#78716c',
            arrowColor: '#c49b66',
            disabledArrowColor: '#d6d3d1',
            monthTextColor: '#1c1917',
            indicatorColor: '#c49b66',
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '800',
            textMonthFontSize: 18,
            textDayHeaderFontSize: 12,
            'stylesheet.calendar.header': {
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-around',
              },
            },
          } as any}
        />

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#c49b66" />
          </View>
        )}
      </View>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
              {years.map((y) => {
                const isSelected = visibleMonth.startsWith(String(y));
                return (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.yearRow,
                      isSelected && styles.selectedYearRow
                    ]}
                    onPress={() => handleYearSelect(y)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.yearText,
                      isSelected && styles.selectedYearText
                    ]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f1ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  calendarContainer: {
    backgroundColor: '#fffdfa',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 253, 250, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  headerArrowButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleButton: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: 280,
    maxHeight: 400,
    backgroundColor: '#fffdfa',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
  },
  yearList: {
    flexGrow: 0,
  },
  yearRow: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 2,
  },
  selectedYearRow: {
    backgroundColor: 'rgba(196, 155, 102, 0.1)',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1917',
  },
  selectedYearText: {
    color: '#c49b66',
    fontWeight: '800',
  },
});
