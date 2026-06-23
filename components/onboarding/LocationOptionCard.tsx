import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

interface LocationOptionCardProps {
  label: string;
  description: string;
  onSelect: () => void;
  icon: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
}

export const LocationOptionCard: React.FC<LocationOptionCardProps> = ({
  label,
  description,
  onSelect,
  icon: Icon,
  loading,
  disabled,
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onSelect}
      style={[styles.container, disabled && styles.disabled]}
      disabled={disabled}
    >
      <AppCard variant="outline" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Icon size={24} color="#0f172a" strokeWidth={2.5} />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <ChevronRight size={20} color="#0f172a" strokeWidth={3} />
        </View>
      </AppCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 20,
    height: 90,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 20,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    opacity: 0.5,
    marginTop: 4,
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
