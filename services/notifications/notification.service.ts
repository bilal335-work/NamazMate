import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { profileService } from '../supabase/profile.service';
import { NotificationSettings } from '@/types/notification';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions() {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  async getPushToken() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('EAS Project ID not found. Push tokens might not work in development.');
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      return token;
    } catch (e) {
      console.error('Error getting push token:', e);
      return null;
    }
  },

  async registerPushToken(userId: string) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const token = await this.getPushToken();
    if (!token) return null;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId = Device.osInternalBuildId || undefined;

    return await profileService.savePushToken(userId, token, platform as 'ios' | 'android', deviceId);
  },

  async schedulePrayerNotification(
    id: string,
    title: string,
    body: string,
    date: Date,
    data: any = {}
  ) {
    // Only schedule if the date is in the future
    if (date.getTime() <= Date.now()) return null;

    try {
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date,
      } as any;

      return await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });
    } catch (e) {
      console.error('Error scheduling notification:', e);
      return null;
    }
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
};
