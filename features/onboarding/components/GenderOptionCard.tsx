import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LucideIcon } from 'lucide-react-native';

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
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onSelect}
      style={styles.container}
    >
      <AppCard 
        variant={selected ? 'solid' : 'outline'}
        style={[
          styles.card,
          selected && { backgroundColor: colors.primary }
        ]}
      >
        <View style={styles.content}>
          <Icon 
            size={32} 
            color={selected ? colors.background : colors.text} 
            strokeWidth={1.5}
          />
          <Text 
            style={[
              styles.label, 
              { color: selected ? colors.background : colors.text }
            ]}
          >
            {label}
          </Text>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});
