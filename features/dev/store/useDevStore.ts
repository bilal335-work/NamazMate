import { create } from 'zustand';

interface DevStore {
  mockTime: Date | null;
  isMockTimeEnabled: boolean;
  setMockTime: (d: Date | null) => void;
  disableMockTime: () => void;
}

export const useDevStore = create<DevStore>((set) => ({
  mockTime: null,
  isMockTimeEnabled: false,
  setMockTime: (d) => set({ mockTime: d, isMockTimeEnabled: true }),
  disableMockTime: () => set({ mockTime: null, isMockTimeEnabled: false }),
}));
