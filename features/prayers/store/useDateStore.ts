import { create } from 'zustand';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DateStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  resetToToday: () => void;
}

export const useDateStore = create<DateStore>((set) => ({
  selectedDate: getTodayString(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  resetToToday: () => set({ selectedDate: getTodayString() }),
}));
