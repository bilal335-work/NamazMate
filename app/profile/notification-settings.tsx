import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { notificationSettings, isLoading } = useProfileSettings();
  const { updateNotificationSettings } = useUpdateProfile();

  const [settings, setSettings] = useState({
    prayer_reminders_enabled: notificationSettings?.prayer_reminders_enabled ?? true,
    before_prayer_reminder_enabled: notificationSettings?.before_prayer_reminder_enabled ?? true,
    qaza_reminder_enabled: notificationSettings?.qaza_reminder_enabled ?? true,
    partner_activity_enabled: notificationSettings?.partner_activity_enabled ?? true,
    invite_notifications_enabled: notificationSettings?.invite_notifications_enabled ?? true,
    push_notifications_enabled: notificationSettings?.push_notifications_enabled ?? false,
    before_prayer_minutes: notificationSettings?.before_prayer_minutes ?? 10,
  });

  React.useEffect(() => {
    if (notificationSettings) {
      setSettings({
        prayer_reminders_enabled: notificationSettings.prayer_reminders_enabled ?? true,
        before_prayer_reminder_enabled: notificationSettings.before_prayer_reminder_enabled ?? true,
        qaza_reminder_enabled: notificationSettings.qaza_reminder_enabled ?? true,
        partner_activity_enabled: notificationSettings.partner_activity_enabled ?? true,
        invite_notifications_enabled: notificationSettings.invite_notifications_enabled ?? true,
        push_notifications_enabled: notificationSettings.push_notifications_enabled ?? false,
        before_prayer_minutes: notificationSettings.before_prayer_minutes ?? 10,
      });
    }
  }, [notificationSettings]);

  const handleSave = async () => {
    try {
      await updateNotificationSettings.mutateAsync(settings);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update notification settings');
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const SwitchRow = ({ label, description, value, onToggle }: any) => (
    <View style={[styles.row, { borderBottomColor: colors.text + '05' }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.rowDesc, { color: colors.text + '40' }]}>{description}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: colors.text + '10', true: colors.primary }}
        thumbColor="white"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f4f1ea' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateNotificationSettings.isPending}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: 'white', borderColor: colors.text + '10' }]}>
          <SwitchRow 
            label="Prayer Reminders" 
            description="Get notified when it's time for prayer"
            value={settings.prayer_reminders_enabled}
            onToggle={() => toggleSetting('prayer_reminders_enabled')}
          />
          <SwitchRow 
            label="Before Prayer" 
            description={`Remind me ${settings.before_prayer_minutes} minutes before`}
            value={settings.before_prayer_reminder_enabled}
            onToggle={() => toggleSetting('before_prayer_reminder_enabled')}
          />
          <SwitchRow 
            label="Qaza Reminders" 
            description="Nudge me for missed prayers"
            value={settings.qaza_reminder_enabled}
            onToggle={() => toggleSetting('qaza_reminder_enabled')}
          />
          <SwitchRow 
            label="Partner Activity" 
            description="When my partner completes a prayer or sends a nudge"
            value={settings.partner_activity_enabled}
            onToggle={() => toggleSetting('partner_activity_enabled')}
          />
          <SwitchRow 
            label="Duo Invites" 
            description="When someone sends a partner request"
            value={settings.invite_notifications_enabled}
            onToggle={() => toggleSetting('invite_notifications_enabled')}
            isLast
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text + '40' }]}>
            Push notification permission is required for these alerts to appear on your device.
          </Text>
        </View>
      </ScrollView>

      {updateNotificationSettings.isPending && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    paddingRight: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 13,
  },
  footer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
