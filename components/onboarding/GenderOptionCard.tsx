import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LucideIcon, Check } from 'lucide-react-native';

interface GenderOptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
}

export const GenderOptionCard: React.FC<GenderOptionCardProps> = ({
  label,
  selected,
  onSelect,
  icon: Icon,
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onSelect}
      style={[
        styles.container,
        selected && styles.containerSelected
      ]}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconWrapper,
          selected && styles.iconWrapperSelected
        ]}>
          <Icon 
            size={28} 
            color={selected ? '#f4f1ea' : '#0f172a'} 
            strokeWidth={2.5}
          />
        </View>
        <Text style={[
          styles.label,
          selected && styles.labelSelected
        ]}>
          {label}
        </Text>
      </View>
      {selected && (
        <View style={styles.checkWrapper}>
          <Check size={16} color="#94a3b8" strokeWidth={4} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    height: 72,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  containerSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(244, 241, 234, 0.1)',
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  labelSelected: {
    color: '#f4f1ea',
  },
  checkWrapper: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
