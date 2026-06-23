import { TodayPrayerTimes, PrayerKey, PrayerLog, PrayerStatus } from '@/features/prayers/types';
import { useDevStore } from '@/features/dev/store/useDevStore';

export type PrayerState = 'upcoming' | 'active' | 'completed';

interface CountdownResult {
  activePrayerKey: PrayerKey | null;
  nextPrayerKey: PrayerKey | null;
  state: PrayerState;
  timeLeft: string; // HH:mm:ss
  remainingSeconds: number;
  progress: number; // 0 to 1
}

/**
 * Calculates display-only row statuses for Home row previews using locked MVP window boundaries.
 */
export function getPrayerDisplayStatuses(
  prayerTimes: TodayPrayerTimes | null,
  prayerLog: PrayerLog | null,
  displayNow: Date
): Record<PrayerKey, PrayerStatus> {
  const result: Record<PrayerKey, PrayerStatus> = {
    fajr: 'locked',
    dhuhr: 'locked',
    asr: 'locked',
    maghrib: 'locked',
    isha: 'locked',
  };

  if (!prayerTimes) return result;

  const getWindow = (key: PrayerKey) => {
    const start = new Date(prayerTimes[key]);
    let end: Date;
    
    if (key === 'fajr') {
      end = new Date(prayerTimes.sunrise);
    } else if (key === 'dhuhr') {
      end = new Date(prayerTimes.asr);
    } else if (key === 'asr') {
      end = new Date(prayerTimes.maghrib);
    } else if (key === 'maghrib') {
      end = new Date(prayerTimes.isha);
    } else {
      // Isha ends at next-day Fajr start
      const todayFajr = new Date(prayerTimes.fajr);
      end = new Date(todayFajr.getTime() + 24 * 60 * 60 * 1000);
    }
    return { start, end };
  };

  let displayNowDateStr = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: prayerTimes.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(displayNow);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    if (y && m && d) {
      displayNowDateStr = `${y}-${m}-${d}`;
    } else {
      throw new Error('formatToParts failed');
    }
  } catch (e) {
    const year = displayNow.getFullYear();
    const month = String(displayNow.getMonth() + 1).padStart(2, '0');
    const day = String(displayNow.getDate()).padStart(2, '0');
    displayNowDateStr = `${year}-${month}-${day}`;
  }

  const isSameDay = displayNowDateStr === (prayerTimes.prayer_date || prayerTimes.date);
  const keys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (const key of keys) {
    const backendStatus = prayerLog?.[`${key}_status` as keyof PrayerLog];

    // 1. Unconditionally preserve prayed / qaza_prayed
    if (backendStatus === 'prayed' || backendStatus === 'qaza_prayed') {
      result[key] = backendStatus as PrayerStatus;
      continue;
    }

    // 2. For same-day display, calculate dynamically and ignore backend 'not_completed'
    if (isSameDay) {
      const { start, end } = getWindow(key);
      if (displayNow < start) {
        result[key] = 'locked';
      } else if (displayNow >= start && displayNow < end) {
        result[key] = 'available';
      } else {
        // displayNow >= end on same day
        result[key] = 'qaza_available';
      }
    } else {
      // 3. For past/future days:
      // If backend says 'not_completed', preserve it.
      if (backendStatus === 'not_completed') {
        result[key] = 'not_completed';
        continue;
      }

      // Otherwise evaluate relative to displayNow
      const { start, end } = getWindow(key);
      if (displayNow < start) {
        result[key] = 'locked';
      } else if (displayNow >= start && displayNow < end) {
        result[key] = 'available';
      } else {
        // displayNow >= end on a past day
        result[key] = 'not_completed';
      }
    }
  }

  return result;
}

export const usePrayerCountdown = (
  prayerTimes: TodayPrayerTimes | null,
  prayerLog: PrayerLog | null,
  displayNow?: Date
): CountdownResult => {
  const mockTime = useDevStore(s => s.mockTime);
  const now = mockTime ?? displayNow ?? new Date();

  if (!prayerTimes) {
    return {
      activePrayerKey: null,
      nextPrayerKey: null,
      state: 'completed',
      timeLeft: '00:00:00',
      remainingSeconds: 0,
      progress: 0,
    };
  }

  const keys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  // Define windows
  const getWindow = (key: PrayerKey) => {
    const start = new Date(prayerTimes[key]);
    let end: Date;
    
    if (key === 'fajr') {
      end = new Date(prayerTimes.sunrise);
    } else if (key === 'dhuhr') {
      end = new Date(prayerTimes.asr);
    } else if (key === 'asr') {
      end = new Date(prayerTimes.maghrib);
    } else if (key === 'maghrib') {
      end = new Date(prayerTimes.isha);
    } else {
      const todayFajr = new Date(prayerTimes.fajr);
      end = new Date(todayFajr.getTime() + 24 * 60 * 60 * 1000);
    }
    return { start, end };
  };

  const displayStatuses = getPrayerDisplayStatuses(prayerTimes, prayerLog, now);

  let activeKey: PrayerKey | null = null;
  let nextKey: PrayerKey | null = null;
  let state: PrayerState = 'completed';
  let targetTime: Date | null = null;
  let startTime: Date | null = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const { start, end } = getWindow(key);
    
    const status = displayStatuses[key];
    const isCompletedOrQaza = status === 'prayed' || status === 'qaza_prayed' || status === 'qaza_available' || status === 'not_completed';

    if (now < start) {
      nextKey = key;
      state = 'upcoming';
      targetTime = start;
      if (i === 0) {
         startTime = new Date(start.getTime() - 2 * 60 * 60 * 1000);
      } else {
         const prev = getWindow(keys[i-1]);
         startTime = prev.end.getTime() < start.getTime() ? prev.end : prev.start;
      }
      break;
    } else if (now >= start && now < end) {
      if (isCompletedOrQaza) continue; 
      activeKey = key;
      state = 'active';
      targetTime = end;
      startTime = start;
      break;
    }
  }

  if (!activeKey && !nextKey) {
    // Fallback: All today's prayers are finished.
    nextKey = 'fajr';
    state = 'upcoming';
    const todayFajr = new Date(prayerTimes.fajr);
    targetTime = new Date(todayFajr.getTime() + 24 * 60 * 60 * 1000);
    startTime = new Date(prayerTimes.isha);
  }

  if (!targetTime) {
    return { activePrayerKey: null, nextPrayerKey: null, state: 'completed', timeLeft: '00:00:00', remainingSeconds: 0, progress: 1 };
  }

  const diff = targetTime.getTime() - now.getTime();
  const secondsTotal = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  const timeLeft = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
  
  let progress = 0;
  if (startTime && targetTime) {
    const total = targetTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    if (state === 'active') {
      // Decreases as the current prayer window runs out
      progress = Math.min(Math.max((total - elapsed) / total, 0), 1);
    } else {
      // Increases as the next prayer gets closer
      progress = Math.min(Math.max(elapsed / total, 0), 1);
    }
  }

  return {
    activePrayerKey: activeKey,
    nextPrayerKey: nextKey,
    state,
    timeLeft,
    remainingSeconds: secondsTotal,
    progress,
  };
};
