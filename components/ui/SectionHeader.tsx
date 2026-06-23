import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  centered = false,
}) => {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <View style={[styles.titleWrapper, centered && styles.centeredTitle]}>
        <Text style={[styles.title, centered && styles.centeredText]}>{title}</Text>
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, centered && styles.centeredText]}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  centered: {
    alignItems: 'center',
  },
  titleWrapper: {
    alignSelf: 'flex-start',
  },
  centeredTitle: {
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 42,
    color: '#0f172a',
    lineHeight: 48,
  },
  centeredText: {
    textAlign: 'center',
  },
  underline: {
    height: 2.5,
    backgroundColor: '#0f172a',
    width: '100%',
    marginTop: -2,
  },
  subtitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
});
