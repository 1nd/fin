// CCA: 1
export type SpacingScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type FontWeightScale = 'regular' | 'medium' | 'bold';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  primary: string;
  onPrimary: string;
  positive: string;
  negative: string;
  warning: string;
  overlay: string;
}

export type ThemeSpacing = Record<SpacingScale, number>;

export interface ThemeTypography {
  fontFamily: string;
  sizes: Record<FontSizeScale, number>;
  lineHeights: Record<FontSizeScale, number>;
  weights: Record<FontWeightScale, '400' | '500' | '700'>;
}

export type ThemeRadii = Record<'sm' | 'md' | 'lg' | 'full', number>;

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  radii: ThemeRadii;
}
