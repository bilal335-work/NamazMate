export const formatPrayerTime = (date: Date | string | null, format: '12h' | '24h' = '12h') => {
  if (!date) return '--:--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--:--';

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  if (format === '24h') {
    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hStr}:${mStr}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${mStr} ${period}`;
  }
};
