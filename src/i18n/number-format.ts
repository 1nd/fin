// CCA: 1
import type { NumberFormatPreference } from '@/domain/models';

const INTL_LOCALES: Record<NumberFormatPreference, string> = {
  'en-US': 'en-US',
  'id-ID': 'id-ID',
};

/** Thousands/decimal separators follow the number format preference, never the UI language (localization spec). */
export function formatNumber(
  value: number,
  preference: NumberFormatPreference,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALES[preference], options).format(value);
}
