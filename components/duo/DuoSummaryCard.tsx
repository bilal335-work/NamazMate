import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AppCard } from '@/components/ui/AppCard';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DuoPartner } from '@/features/duo/types';

interface DuoSummaryCardProps {
  userScore: number;
  partnerScore: number;
  partner: DuoPartner;
}

export const DuoSummaryCard: React.FC<DuoSummaryCardProps> = ({
  userScore,
  partnerScore,
  partner,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const renderProgress = (score: number) => {
    const percentage = (score / 5) * 100;
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.text + '10' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${percentage}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.scoreText, { color: colors.text }]}>{score}/5</Text>
      </View>
    );
  };

  return (
    <AppCard style={styles.container}>
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]}>You</Text>
          {renderProgress(userScore)}
        </View>
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.text + '10' }]} />

      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{partner.full_name}</Text>
          {renderProgress(partnerScore)}
        </View>
        <UserAvatar 
          type={partner.avatar_type} 
          style={partner.avatar_style} 
          size={40} 
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 30,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  }
});
