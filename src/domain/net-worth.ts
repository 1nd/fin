// CCA: 1
import type { Entry } from './models';
import { toBaseAmount } from './fx';

export interface NetWorthPoint {
  date: string;
  netWorth: number;
}

/**
 * Net worth at each date for which a snapshot exists, carrying forward the
 * most recently known balance per category (snapshots don't repeat every
 * period, so a category's value holds until its next snapshot).
 */
export function computeNetWorthOverTime(entries: Entry[]): NetWorthPoint[] {
  const snapshots = entries.filter((e) => e.entityType === 'asset' || e.entityType === 'liability');
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const dates = Array.from(new Set(sorted.map((e) => e.date))).sort();

  const latestByCategory = new Map<string, { value: number; sign: 1 | -1 }>();
  const points: NetWorthPoint[] = [];

  for (const date of dates) {
    for (const entry of sorted.filter((e) => e.date === date)) {
      latestByCategory.set(entry.categoryId, {
        value: toBaseAmount(entry),
        sign: entry.entityType === 'asset' ? 1 : -1,
      });
    }
    let netWorth = 0;
    for (const { value, sign } of latestByCategory.values()) {
      netWorth += value * sign;
    }
    points.push({ date, netWorth });
  }

  return points;
}
