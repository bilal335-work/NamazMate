import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LucideIcon } from 'lucide-react-native';

interface LocationOptionCardProps {
  label: string;
  description: string;
  onSelect: () => void;
  icon: LucideIcon;
  loading?: boolean;
}

export const LocationOptionCard: React.FC<LocationOptionCardProps> = ({
  label,
  description,
  onSelect,
  icon: Icon,
  loading,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onSelect}
      style={styles.container}
      disabled={loading}
    >
      <AppCard variant="outline" style={styles.card}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Icon size={24} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.description, { color: colors.text + '80' }]}>{description}</Text>
          </View>
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
    padding: 16,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
});
