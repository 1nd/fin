// CCA: 1
import { darkTheme } from './dark';
import type { Theme } from './tokens';

export type ThemeName = 'dark';

/** Registering a future theme (e.g. Light) means adding an entry here — no component changes. */
export const themeRegistry: Record<ThemeName, Theme> = {
  dark: darkTheme,
};

export const defaultThemeName: ThemeName = 'dark';
