import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type Period = 7 | 30 | 0;

interface DuoHistoryTabsProps {
  activePeriod: Period;
  onPeriodChange: (period: Period) => void;
}

export const DuoHistoryTabs: React.FC<DuoHistoryTabsProps> = ({
  activePeriod,
  onPeriodChange,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const tabs: { label: string; value: Period }[] = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: 'All Time', value: 0 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.text + '05' }]}>
      {tabs.map((tab) => {
        const isActive = activePeriod === tab.value;
        return (
          <TouchableOpacity
            key={tab.label}
            style={[
              styles.tab,
              isActive && { backgroundColor: colors.background, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }
            ]}
            onPress={() => onPeriodChange(tab.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} History`}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: isActive ? colors.text : colors.text + '60' },
                isActive && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
});
