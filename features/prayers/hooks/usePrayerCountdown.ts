import { useState, useEffect } from 'react';
import { TodayPrayerTimes, PrayerKey } from '@/types/prayer';

interface CountdownResult {
  nextPrayerKey: PrayerKey | null;
  timeLeft: string; // HH:mm:ss
  progress: number; // 0 to 1
}

export const usePrayerCountdown = (prayerTimes: TodayPrayerTimes | null): CountdownResult => {
  const [result, setResult] = useState<CountdownResult>({
    nextPrayerKey: null,
    timeLeft: '00:00:00',
    progress: 0,
  });

  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      const now = new Date();
      const keys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      
      let nextKey: PrayerKey | null = null;
      let nextTime: Date | null = null;
      let prevTime: Date | null = null;

      for (let i = 0; i < keys.length; i++) {
        const time = new Date(prayerTimes[keys[i]]);
        if (time > now) {
          nextKey = keys[i];
          nextTime = time;
          prevTime = i > 0 ? new Date(prayerTimes[keys[i - 1]]) : null;
          break;
        }
      }

      // If all passed, next is Fajr tomorrow (not handling tomorrow here for MVP foundation)
      if (!nextKey || !nextTime) {
        setResult({ nextPrayerKey: null, timeLeft: 'Completed', progress: 1 });
        return;
      }

      const diff = nextTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const timeLeft = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      let progress = 0;
      if (prevTime && nextTime) {
        const total = nextTime.getTime() - prevTime.getTime();
        const elapsed = now.getTime() - prevTime.getTime();
        progress = Math.min(Math.max(elapsed / total, 0), 1);
      }

      setResult({ nextPrayerKey: nextKey, timeLeft, progress });
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  return result;
};
