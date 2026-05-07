const RELATIVE_TIME_UNITS: { name: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { name: 'year', seconds: 31104000 },
  { name: 'month', seconds: 2592000 },
  { name: 'week', seconds: 604800 },
  { name: 'day', seconds: 86400 },
  { name: 'hour', seconds: 3600 },
  { name: 'minute', seconds: 60 },
  { name: 'second', seconds: 1 }
];

/**
 * Returns a human-readable relative time string for a given date using
 * Intl.RelativeTimeFormat for locale-aware output.
 * e.g. "just now", "3 minutes ago", "2 hours ago", "last year"
 *
 * @param date - Date, ISO string, or timestamp (ms)
 * @param locale - BCP 47 locale tag (defaults to 'en')
 */
export function getRelativeTime(
  date: Date | string | number | undefined | null,
  locale = 'en'
): string {
  if (date == null) return 'N/A';
  // Coerce numeric strings (e.g. "1714384000000") to a number before Date parsing
  const raw = typeof date === 'string' && /^\d+$/.test(date) ? Number(date) : date;
  const then = new Date(raw as Date | string | number).getTime();
  if (isNaN(then) || then === 0) return 'N/A';

  const seconds = Math.round((then - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  const unit =
    RELATIVE_TIME_UNITS.find((u) => absSeconds >= u.seconds) ??
    RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];

  const value = Math.round(seconds / unit.seconds);

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    value,
    unit.name
  );
}
