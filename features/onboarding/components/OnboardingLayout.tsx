import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface OnboardingLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <SectionHeader 
            title={title} 
            subtitle={subtitle} 
          />
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </ScrollView>
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
});
