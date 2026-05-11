import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ProfileRowProps {
  label: string;
  value?: string | null;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}

export const ProfileRow: React.FC<ProfileRowProps> = ({
  label,
  value,
  onPress,
  destructive = false,
  isLast = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.text + '05' }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <View style={styles.content}>
        <Text style={[
          styles.label, 
          { color: destructive ? '#EF4444' : colors.text }
        ]}>
          {label}
        </Text>
        <View style={styles.rightContent}>
          {value && (
            <Text style={[styles.value, { color: colors.text + '40' }]} numberOfLines={1}>
              {value}
            </Text>
          )}
          {onPress && <ChevronRight size={18} color={colors.text + '20'} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 15,
    flexShrink: 1,
  },
});
