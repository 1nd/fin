// CCA: 1
import type { Theme } from './tokens';

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    border: '#333333',
    textPrimary: '#F5F5F5',
    textSecondary: '#ABABAB',
    textDisabled: '#6B6B6B',
    primary: '#4F9DFF',
    onPrimary: '#0A1220',
    positive: '#4CD787',
    negative: '#FF6B6B',
    warning: '#F5C451',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
    lineHeights: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 40,
    },
    weights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 999,
  },
};
