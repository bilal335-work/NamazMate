import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text + '60' }]}>{title}</Text>
      <View style={[styles.content, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  content: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
