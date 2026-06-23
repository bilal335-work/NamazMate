import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { profileService } from '@/features/profile/services/profile.service';
import { NotificationSettings } from '@/features/notifications/types';

const isExpoGo = Constants.appOwnership === 'expo';

// Only set up notification handler if not in Expo Go, or lazily if needed.
// Actually, local notifications might work in Expo Go, but the remote push token crashes.
// Let's lazy load it.
let Notifications: typeof import('expo-notifications') | null = null;

const getNotifications = async () => {
  if (!Notifications) {
    Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return Notifications;
};

export const notificationService = {
  async requestPermissions() {
    if (Platform.OS === 'web') return false;

    const notifs = await getNotifications();
    const { status: existingStatus } = await notifs.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notifs.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  async getPushToken() {
    if (isExpoGo) {
      console.log('Push notifications (remote) are not supported in Expo Go on SDK 53+. Please use a development build.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                        Constants?.easConfig?.projectId ?? 
                        '11d0e029-3af1-4d19-8926-8f4534cdb2e5';
      
      if (!projectId) {
        console.warn('Push Notifications: No EAS Project ID found in app.json. Please run "eas project:init" or add it manually.');
        return null;
      }

      const notifs = await getNotifications();

      const token = (await notifs.getExpoPushTokenAsync({
        projectId,
      })).data;

      return token;
    } catch (e: any) {
      // Specifically handle the common "Firebase not initialized" error on Android development builds
      if (Platform.OS === 'android' && e.message?.includes('FirebaseApp is not initialized')) {
        console.warn('Push Notifications: Firebase/FCM not initialized. Remote push notifications will not work until google-services.json is added and the app is rebuilt.');
      } else {
        console.error('Error getting push token:', e);
      }
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
    if (date.getTime() <= Date.now()) return null;

    try {
      const notifs = await getNotifications();
      const trigger: any = {
        type: notifs.SchedulableTriggerInputTypes.DATE,
        date: date,
      };

      return await notifs.scheduleNotificationAsync({
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
    const notifs = await getNotifications();
    await notifs.cancelAllScheduledNotificationsAsync();
  },

  async getScheduledNotifications() {
    const notifs = await getNotifications();
    return await notifs.getAllScheduledNotificationsAsync();
  }
};
