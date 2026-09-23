export const COLORS = {
  primary: '#1a120b',
  secondary: '#2c221e',
  accent: '#ff3333',
  accentGlow: 'rgba(255, 51, 51, 0.25)',
  surface: '#ffffff',
  surfaceAlt: '#f8f5f2',
  bgPage: '#f4f0ec',
  bgDark: '#0d0907',
  text: '#1a120b',
  textMuted: '#6b5e54',
  textLight: '#fdf8f6',
  border: '#e4ddd7',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 50,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 48,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  }
};