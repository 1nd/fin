import { formatNumber } from './number-format';

describe('formatNumber', () => {
  it('formats using Indonesian conventions ("." thousands, "," decimal) for id-ID', () => {
    expect(formatNumber(1234567.89, 'id-ID')).toBe('1.234.567,89');
  });

  it('formats using US conventions ("," thousands, "." decimal) for en-US', () => {
    expect(formatNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
  });

  it('produces different digit grouping for the same value across preferences', () => {
    const value = 50000;
    expect(formatNumber(value, 'id-ID')).not.toBe(formatNumber(value, 'en-US'));
  });

  it('passes through additional Intl.NumberFormat options', () => {
    expect(formatNumber(1234567, 'id-ID', { minimumFractionDigits: 2 })).toBe('1.234.567,00');
  });
});
