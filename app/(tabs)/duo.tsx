import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Share, Alert } from 'react-native';
import { Copy, Share2, Plus, ArrowRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useActivePair } from '@/features/duo/hooks/useActivePair';
import { usePairInvites } from '@/features/duo/hooks/usePairInvites';
import { useCreatePairInvite } from '@/features/duo/hooks/useCreatePairInvite';
import { useAcceptPairInvite } from '@/features/duo/hooks/useAcceptPairInvite';
import { useDuoRealtime } from '@/features/duo/hooks/useDuoRealtime';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppCard } from '@/components/ui/AppCard';
import { DuoDashboard } from '@/components/duo/DuoDashboard';

export default function DuoScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  
  const { data: activePair, isLoading: loadingPair, refetch: refetchPair } = useActivePair();
  const { data: invites, isLoading: loadingInvites, refetch: refetchInvites } = usePairInvites();
  const { mutate: createInvite, isPending: creatingInvite } = useCreatePairInvite();
  const { mutate: acceptInvite, isPending: acceptingInvite } = useAcceptPairInvite();
  
  useDuoRealtime();

  const onRefresh = async () => {
    await Promise.all([refetchPair(), refetchInvites()]);
  };

  const handleCreateInvite = () => {
    createInvite();
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Invite code copied to clipboard.');
  };

  const handleShareInvite = async (code: string) => {
    try {
      await Share.share({
        message: `Assalamu Alaikum! Join me as my prayer partner on NamazMate. Use my invite code: ${code}\n\nDownload NamazMate: https://namazmate.app`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAcceptInvite = () => {
    if (!inviteCodeInput.trim()) return;
    acceptInvite(inviteCodeInput.trim(), {
      onSuccess: () => {
        setInviteCodeInput('');
        Alert.alert('Success', 'Duo partnership established!');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to accept invite.');
      }
    });
  };

  if (loadingPair || loadingInvites) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (activePair) {
    return <DuoDashboard pair={activePair} onRefresh={onRefresh} />;
  }

  const pendingInvite = invites?.sent.find(i => i.status === 'pending');

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Duo</Text>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
          Connect with a prayer partner and stay consistent together.
        </Text>
      </View>

      {/* Invitation Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Share Invite Code</Text>
        {pendingInvite ? (
          <AppCard style={styles.inviteCard}>
            <View style={styles.codeContainer}>
              <Text style={[styles.codeLabel, { color: colors.text + '60' }]}>Your invite code</Text>
              <Text style={[styles.codeText, { color: colors.primary }]}>{pendingInvite.code}</Text>
            </View>
            <View style={styles.inviteActions}>
              <AppButton 
                title="Copy" 
                variant="outline" 
                onPress={() => handleCopyCode(pendingInvite.code)}
                icon={<Copy size={18} color={colors.primary} />}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton 
                title="Share" 
                variant="outline" 
                onPress={() => handleShareInvite(pendingInvite.code)}
                icon={<Share2 size={18} color={colors.primary} />}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={[styles.expiryText, { color: colors.text + '40' }]}>
              Expires on {new Date(pendingInvite.expires_at).toLocaleDateString()}
            </Text>
          </AppCard>
        ) : (
          <AppCard style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.text + '60' }]}>
              Invite someone to become your prayer partner.
            </Text>
            <AppButton 
              title="Create Invite" 
              onPress={handleCreateInvite}
              loading={creatingInvite}
              icon={<Plus size={20} color="#fff" />}
            />
          </AppCard>
        )}
      </View>

      {/* Accept Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter Invite Code</Text>
        <AppCard style={styles.acceptCard}>
          <AppInput 
            placeholder="e.g. ABC123"
            value={inviteCodeInput}
            onChangeText={(text) => setInviteCodeInput(text.toUpperCase())}
            autoCapitalize="characters"
          />
          <AppButton 
            title="Accept Invite" 
            onPress={handleAcceptInvite}
            loading={acceptingInvite}
            disabled={!inviteCodeInput.trim()}
            icon={<ArrowRight size={20} color="#fff" />}
            style={{ marginTop: 12 }}
          />
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inviteCard: {
    padding: 20,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  inviteActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  expiryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  acceptCard: {
    padding: 20,
  },
  pairedCard: {
    padding: 40,
    alignItems: 'center',
    margin: 20,
  }
});
