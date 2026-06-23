import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface OnboardingLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollEnabled?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  title,
  subtitle,
  children,
  footer,
  scrollEnabled = true,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.header}>
          <SectionHeader 
            title={title} 
            subtitle={subtitle} 
            centered
          />
        </View>
        <View style={styles.content}>
          {children}
        </View>
        {footer && (
          <View style={styles.footer}>
            {footer}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    width: '100%',
  },
  content: {
    width: '100%',
  },
  footer: {
    marginTop: 40,
    width: '100%',
    paddingBottom: 20,
  },
});
