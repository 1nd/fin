// CCA: 3
/** Browser locale fallback source for `resolveInitialLocalePreferences` (design Decision 8). */
export function getBrowserLocale(): string | null {
  return typeof navigator !== 'undefined' ? (navigator.language ?? null) : null;
}
