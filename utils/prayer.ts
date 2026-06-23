import { PrayerKey } from '@/features/prayers/types';

/**
 * Checks if a given date or ISO string is a Friday in a specific timezone.
 * Handles calendar date strings (YYYY-MM-DD) safely without shifting days.
 */
export function isFridayInTimezone(dateOrString: Date | string, timezone: string): boolean {
  if (typeof dateOrString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrString)) {
    const [year, month, day] = dateOrString.split('-').map(Number);
    // Construct local Date at noon to prevent any timezone wrap-arounds
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    return localDate.getDay() === 5;
  }
  
  try {
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    return formatter.format(date) === 'Friday';
  } catch (e) {
    const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
    return date.getDay() === 5; // Fallback to local device getDay()
  }
}

interface DisplayNameOptions {
  gender?: string | null;
  date?: Date | string | null;
  timezone?: string | null;
}

/**
 * Resolves the localized display name for a prayer.
 * Returns "Jummah" on Fridays for male users instead of "Dhuhr".
 */
export function getPrayerDisplayName(
  prayerKey: string,
  options?: DisplayNameOptions
): string {
  if (prayerKey === 'dhuhr' && options?.gender === 'male' && options?.date) {
    const tz = options.timezone || 'UTC';
    if (isFridayInTimezone(options.date, tz)) {
      return 'Jummah';
    }
  }

  // Capitalize normal prayers
  switch (prayerKey) {
    case 'fajr': return 'Fajr';
    case 'dhuhr': return 'Dhuhr';
    case 'asr': return 'Asr';
    case 'maghrib': return 'Maghrib';
    case 'isha': return 'Isha';
    default:
      return prayerKey.charAt(0).toUpperCase() + prayerKey.slice(1);
  }
}

/**
 * Extracts hour and minute of a Date object inside a specific timezone.
 */
export function getTimeInTimezone(date: Date, timezone: string): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find(p => p.type === 'hour')?.value);
    const minute = Number(parts.find(p => p.type === 'minute')?.value);
    return { hour, minute };
  } catch (e) {
    return { hour: date.getHours(), minute: date.getMinutes() };
  }
}

interface JummahGuardOptions {
  prayerKey: string;
  gender: string | null | undefined;
  displayNow: Date;
  timezone: string;
  dateStr: string;
}

/**
 * Checks if marking Jummah is blocked by the hardcoded 1:15 PM Jamaat threshold.
 * Only blocks male Friday users before 13:15.
 */
export function canMarkJummahNow(options: JummahGuardOptions): { allowed: boolean; reason?: string } {
  const isMale = options.gender === 'male';
  if (options.prayerKey !== 'dhuhr' || !isMale) {
    return { allowed: true };
  }

  // Verify Friday
  if (!isFridayInTimezone(options.dateStr, options.timezone)) {
    return { allowed: true };
  }

  // Verify time in timezone is before 13:15
  const { hour, minute } = getTimeInTimezone(options.displayNow, options.timezone);
  const timeVal = hour * 60 + minute;
  const thresholdVal = 13 * 60 + 15; // 13:15 is 795 minutes

  if (timeVal < thresholdVal) {
    return { allowed: false, reason: 'Jummah Jamaat starts at 1:15 PM' };
  }

  return { allowed: true };
}

