// CCA: 1
import type { DateFormatPattern, NumberFormatStyle } from './preferences';

const SEPARATORS: Record<NumberFormatStyle, { thousands: string; decimal: string }> = {
  'period-decimal': { thousands: ',', decimal: '.' },
  'comma-decimal': { thousands: '.', decimal: ',' },
};

// Omitting fractionDigits picks the adaptive default: two fraction digits,
// widened to four when the value carries real sub-cent precision. Passing a
// number fixes the digit count exactly.
export function formatNumber(
  value: number,
  style: NumberFormatStyle,
  fractionDigits?: number,
): string {
  if (!Number.isFinite(value)) return String(value);
  const { thousands, decimal } = SEPARATORS[style];
  const rounded =
    fractionDigits === undefined
      ? roundAdaptive(Math.abs(value))
      : roundHalfUp(Math.abs(value), fractionDigits);
  // Sign comes from the rounded magnitude, not the input: -0.001 at two
  // fraction digits is "0.00", never "-0.00".
  const sign = value < 0 && /[1-9]/.test(rounded) ? '-' : '';
  const [integerPart, fractionPart] = rounded.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  return fractionPart ? `${sign}${grouped}${decimal}${fractionPart}` : `${sign}${grouped}`;
}

// A value with sub-cent precision keeps four fraction digits rather than
// silently losing them; plain amounts show two. Four is Fin's own display
// requirement, informed by (not coupled to) real-world quoting practice such
// as Indonesian fund unit prices like 988.3204 — see design.md D4. Rounding
// at four before trimming keeps float arithmetic noise (0.1 + 0.2) at "0.30".
function roundAdaptive(abs: number): string {
  const rounded = roundHalfUp(abs, 4);
  return rounded.endsWith('00') ? rounded.slice(0, -2) : rounded;
}

// Rounds half-up in string space over String(abs) — the shortest decimal that
// round-trips the float, i.e. the number as the user wrote it. toFixed rounds
// the underlying binary value instead, so (1.005).toFixed(2) is "1.00" where
// a reader of "1.005" expects "1.01".
function roundHalfUp(abs: number, fractionDigits: number): string {
  const text = String(abs);
  // Exponential form means ≥1e21 or <1e-6 — outside any displayable range;
  // toFixed is as good as it gets there.
  if (text.includes('e')) return abs.toFixed(fractionDigits);
  const [integerPart, fraction = ''] = text.split('.');
  if (fraction.length <= fractionDigits) {
    return fractionDigits > 0
      ? `${integerPart}.${fraction.padEnd(fractionDigits, '0')}`
      : integerPart;
  }
  const roundUp = fraction.charAt(fractionDigits) >= '5' ? 1n : 0n;
  const scaled = BigInt(integerPart + fraction.slice(0, fractionDigits)) + roundUp;
  const digits = scaled.toString().padStart(fractionDigits + 1, '0');
  return fractionDigits > 0
    ? `${digits.slice(0, -fractionDigits)}.${digits.slice(-fractionDigits)}`
    : digits;
}

export function formatDate(date: Date, pattern: DateFormatPattern): string {
  const year = String(date.getFullYear());
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  switch (pattern) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
  }
}

// Preferences carry no 12-hour option: every displayed time is 24-hour.
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
