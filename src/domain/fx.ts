// CCA: 1
import type { Entry } from './models';

export function toBaseAmount(entry: Pick<Entry, 'amount' | 'fxRateToBase'>): number {
  return entry.amount * entry.fxRateToBase;
}

export const COMMON_CURRENCIES = [
  'IDR',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'SGD',
  'AUD',
  'MYR',
  'CNY',
] as const;
