import { create } from 'zustand';
import { GenderFormData, PrayerSettingsFormData, LocationFormData, AvatarFormData } from '../schema/onboardingSchema';

interface OnboardingState {
  gender: GenderFormData | null;
  avatar: AvatarFormData | null;
  location: LocationFormData | null;
  prayerSettings: PrayerSettingsFormData | null;
  notificationEnabled: boolean;
  
  setGender: (data: GenderFormData) => void;
  setAvatar: (data: AvatarFormData) => void;
  setLocation: (data: LocationFormData) => void;
  setPrayerSettings: (data: PrayerSettingsFormData) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  gender: null,
  avatar: null,
  location: null,
  prayerSettings: null,
  notificationEnabled: true,

  setGender: (gender) => set({ gender }),
  setAvatar: (avatar) => set({ avatar }),
  setLocation: (location) => set({ location }),
  setPrayerSettings: (prayerSettings) => set({ prayerSettings }),
  setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
  reset: () => set({ 
    gender: null, 
    avatar: null,
    location: null, 
    prayerSettings: null, 
    notificationEnabled: true 
  }),
}));
