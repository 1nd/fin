import { formatDate, formatDateTime, formatTime24h } from './date-format';

const SAMPLE_DATE = new Date(2026, 2, 15); // 2026-03-15 (month is 0-indexed)

describe('formatDate', () => {
  it('formats YYYY-MM-DD', () => {
    expect(formatDate(SAMPLE_DATE, 'YYYY-MM-DD')).toBe('2026-03-15');
  });

  it('formats DD-MM-YYYY', () => {
    expect(formatDate(SAMPLE_DATE, 'DD-MM-YYYY')).toBe('15-03-2026');
  });

  it('formats MM-DD-YYYY', () => {
    expect(formatDate(SAMPLE_DATE, 'MM-DD-YYYY')).toBe('03-15-2026');
  });

  it('accepts an ISO string in addition to a Date', () => {
    expect(formatDate('2026-03-15T00:00:00', 'YYYY-MM-DD')).toBe('2026-03-15');
  });
});

describe('formatTime24h', () => {
  it('renders an afternoon time in 24-hour format regardless of preference', () => {
    const afternoon = new Date(2026, 2, 15, 23, 59);
    expect(formatTime24h(afternoon)).toBe('23:59');
  });

  it('zero-pads single-digit hours and minutes', () => {
    const earlyMorning = new Date(2026, 2, 15, 5, 3);
    expect(formatTime24h(earlyMorning)).toBe('05:03');
  });
});

describe('formatDateTime', () => {
  it('combines the date format preference with a fixed 24-hour time', () => {
    const date = new Date(2026, 2, 15, 13, 30);
    expect(formatDateTime(date, 'DD-MM-YYYY')).toBe('15-03-2026 13:30');
  });
});
