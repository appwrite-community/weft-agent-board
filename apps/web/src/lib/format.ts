const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const fullDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "just now", "2 min ago", "3 h ago", "2 days ago", then "Sep 22". */
export function relativeTime(iso: string, now: number) {
  const elapsed = Math.max(0, now - Date.parse(iso));
  if (elapsed < 45_000) return 'just now';
  if (elapsed < HOUR) return `${Math.max(1, Math.round(elapsed / MINUTE))} min ago`;
  if (elapsed < DAY) return `${Math.round(elapsed / HOUR)} h ago`;
  if (elapsed < 7 * DAY) {
    const days = Math.round(elapsed / DAY);
    return days === 1 ? 'yesterday' : `${days} days ago`;
  }
  return monthDay.format(new Date(iso));
}

/** "Oct 7" */
export const shortDate = (iso: string) => monthDay.format(new Date(iso));

/** "Wednesday, October 7, 2026" */
export const longDate = (iso: string) => fullDate.format(new Date(iso));

/** "Sep 30, 2:41 PM" */
export const exactTime = (iso: string) => dateTime.format(new Date(iso));

/** A due date is overdue from the day after it. */
export function isOverdue(iso: string, now: number) {
  const due = new Date(iso);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < now;
}

/** "8.4s", "1m 05s" */
export function duration(fromIso: string, toIso: string) {
  const ms = Math.max(0, Date.parse(toIso) - Date.parse(fromIso));
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export const firstName = (name: string) => name.split(' ')[0] ?? name;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
  ).toUpperCase();
}
