// CCA: 1
import type { DateFormatPreference } from '@/domain/models';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Exactly the three fixed patterns the localization spec allows — no general date-convention system. */
export function formatDate(value: Date | string, preference: DateFormatPreference): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const yyyy = date.getFullYear().toString();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());

  switch (preference) {
    case 'DD-MM-YYYY':
      return `${dd}-${mm}-${yyyy}`;
    case 'MM-DD-YYYY':
      return `${mm}-${dd}-${yyyy}`;
    case 'YYYY-MM-DD':
    default:
      return `${yyyy}-${mm}-${dd}`;
  }
}

/** Time has no format preference in Phase 1 — always 24-hour, regardless of language/number/date format. */
export function formatTime24h(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(value: Date | string, preference: DateFormatPreference): string {
  return `${formatDate(value, preference)} ${formatTime24h(value)}`;
}
