// CCA: 4
import React, { createContext, useContext, useMemo } from 'react';
import { defaultThemeName, themeRegistry, type ThemeName } from './registry';
import type { Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  themeName = defaultThemeName,
  children,
}: {
  themeName?: ThemeName;
  children: React.ReactNode;
}) {
  const theme = useMemo<Theme>(() => themeRegistry[themeName], [themeName]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Calling code depends on this hook, never on a theme token file directly. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
