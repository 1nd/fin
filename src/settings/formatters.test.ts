import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, formatTime } from './formatters';

describe('formatNumber', () => {
  it('formats using the period-decimal style', () => {
    expect(formatNumber(1234.5, 'period-decimal')).toBe('1,234.50');
  });

  it('formats using the comma-decimal style', () => {
    expect(formatNumber(1234.5, 'comma-decimal')).toBe('1.234,50');
  });

  it('formats negative numbers', () => {
    expect(formatNumber(-1234.5, 'period-decimal')).toBe('-1,234.50');
  });

  it('groups numbers larger than a thousand', () => {
    expect(formatNumber(1234567.8912, 'period-decimal', 4)).toBe('1,234,567.8912');
  });

  it('does not group numbers under a thousand', () => {
    expect(formatNumber(42, 'period-decimal')).toBe('42.00');
  });

  it('formats four fraction digits in both styles', () => {
    expect(formatNumber(1234.5678, 'period-decimal', 4)).toBe('1,234.5678');
    expect(formatNumber(1234.5678, 'comma-decimal', 4)).toBe('1.234,5678');
  });

  it('pads the fraction to the requested digits', () => {
    expect(formatNumber(42.5, 'period-decimal', 4)).toBe('42.5000');
  });

  it('supports zero fraction digits', () => {
    expect(formatNumber(1234.5, 'period-decimal', 0)).toBe('1,235');
  });

  it('rounds half-way values up as read, not as the binary float', () => {
    // (1.005).toFixed(2) === '1.00' because the float is 1.00499…; a reader
    // of "1.005" expects half-up to "1.01".
    expect(formatNumber(1.005, 'period-decimal', 2)).toBe('1.01');
    expect(formatNumber(0.12345, 'period-decimal', 4)).toBe('0.1235');
  });

  it('rounds down when the next digit is below five', () => {
    expect(formatNumber(0.12344, 'period-decimal', 4)).toBe('0.1234');
  });

  it('carries rounding across the decimal separator', () => {
    expect(formatNumber(999.99999, 'period-decimal', 4)).toBe('1,000.0000');
  });

  it('never renders negative zero', () => {
    expect(formatNumber(-0.001, 'period-decimal', 2)).toBe('0.00');
    expect(formatNumber(-0.00001, 'period-decimal')).toBe('0.00');
  });

  it('keeps the sign when a negative rounds to a nonzero value', () => {
    expect(formatNumber(-0.005, 'period-decimal', 2)).toBe('-0.01');
  });

  it('hides float arithmetic noise at the displayed precision', () => {
    expect(formatNumber(0.1 + 0.2, 'period-decimal')).toBe('0.30');
  });

  it('keeps four fraction digits when the value has sub-cent precision', () => {
    expect(formatNumber(988.3204, 'period-decimal')).toBe('988.3204');
    expect(formatNumber(1200948.9593, 'period-decimal')).toBe('1,200,948.9593');
    expect(formatNumber(988.3204, 'comma-decimal')).toBe('988,3204');
  });

  it('trims to two fraction digits when there is no sub-cent precision', () => {
    expect(formatNumber(988.32, 'period-decimal')).toBe('988.32');
  });

  it('pads a three-decimal value up to four fraction digits', () => {
    expect(formatNumber(988.325, 'period-decimal')).toBe('988.3250');
  });

  it('rounds precision beyond four digits down to four', () => {
    expect(formatNumber(0.95935, 'period-decimal')).toBe('0.9594');
  });

  it('keeps the sign and four digits on precise negative values', () => {
    expect(formatNumber(-988.3204, 'period-decimal')).toBe('-988.3204');
  });

  it('trims after a carry leaves no sub-cent precision', () => {
    expect(formatNumber(999.99999, 'period-decimal')).toBe('1,000.00');
  });

  it('passes non-finite values through', () => {
    expect(formatNumber(Number.NaN, 'period-decimal')).toBe('NaN');
    expect(formatNumber(Number.POSITIVE_INFINITY, 'period-decimal')).toBe('Infinity');
  });
});

describe('formatDate', () => {
  const date = new Date(2026, 6, 5);

  it('formats YYYY-MM-DD', () => {
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-07-05');
  });

  it('formats DD-MM-YYYY', () => {
    expect(formatDate(date, 'DD-MM-YYYY')).toBe('05-07-2026');
  });

  it('formats MM-DD-YYYY', () => {
    expect(formatDate(date, 'MM-DD-YYYY')).toBe('07-05-2026');
  });
});

describe('formatTime', () => {
  it('formats in 24-hour time', () => {
    expect(formatTime(new Date(2026, 6, 15, 23, 5))).toBe('23:05');
  });

  it('pads single-digit hours and minutes', () => {
    expect(formatTime(new Date(2026, 6, 15, 4, 3))).toBe('04:03');
  });
});
