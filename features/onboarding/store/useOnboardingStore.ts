import { create } from 'zustand';
import { GenderFormData, PrayerSettingsFormData, LocationFormData } from '../schema/onboardingSchema';

interface OnboardingState {
  gender: GenderFormData | null;
  location: LocationFormData | null;
  prayerSettings: PrayerSettingsFormData | null;
  notificationEnabled: boolean;
  
  setGender: (data: GenderFormData) => void;
  setLocation: (data: LocationFormData) => void;
  setPrayerSettings: (data: PrayerSettingsFormData) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  gender: null,
  location: null,
  prayerSettings: null,
  notificationEnabled: true,

  setGender: (gender) => set({ gender }),
  setLocation: (location) => set({ location }),
  setPrayerSettings: (prayerSettings) => set({ prayerSettings }),
  setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
  reset: () => set({ 
    gender: null, 
    location: null, 
    prayerSettings: null, 
    notificationEnabled: true 
  }),
}));
