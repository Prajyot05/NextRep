// ─── NextRep Design System ─────────────────────────────────────────────────
// "Dark Athletic Premium" — inspired by Hevy, Strong, Nike Training Club

import { Platform } from 'react-native';

// ── Colors ────────────────────────────────────────────────────────────────
export const Colors = {
  // Brand — vivid blue
  primary:       '#0A84FF',
  primaryLight:  '#5AC8FA',
  primaryDark:   '#0059B3',
  primaryMuted:  'rgba(10, 132, 255, 0.15)',

  // Accent — energetic orange/yellow
  accent:        '#FF9F0A',
  accentLight:   '#FFD60A',
  accentMuted:   'rgba(255, 159, 10, 0.15)',

  // Semantic
  success:       '#30D158',
  successMuted:  'rgba(48, 209, 88, 0.15)',
  warning:       '#FFD60A',
  warningMuted:  'rgba(255, 214, 10, 0.15)',
  error:         '#FF453A',
  errorMuted:    'rgba(255, 69, 58, 0.15)',

  // Streak (legacy mapping to accent)
  streak:        '#FF9F0A',
  streakGold:    '#FFD60A',
  streakMuted:   'rgba(255, 159, 10, 0.12)',

  // Background — true black
  bg:            '#000000',
  bgElevated:    '#151515',
  bgCard:        '#151515',
  bgCardHover:   '#1A1A1A',
  bgMuted:       '#1E1E1E',
  bgOverlay:     'rgba(0, 0, 0, 0.8)',

  // Text
  text:          '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted:     'rgba(235, 235, 245, 0.6)',
  textDisabled:  'rgba(235, 235, 245, 0.3)',

  // Border
  border:        'rgba(255, 255, 255, 0.1)',
  borderSubtle:  'rgba(255, 255, 255, 0.05)',
  borderFocus:   '#0A84FF',

  // Muscle group colors (for charts - slightly muted for dark mode)
  muscle: {
    CHEST:       '#FF6B6B',
    BACK:        '#4ECDC4',
    SHOULDERS:   '#45B7D1',
    BICEPS:      '#96CEB4',
    TRICEPS:     '#FFEAA7',
    QUADS:       '#DDA0DD',
    HAMSTRINGS:  '#98D8C8',
    GLUTES:      '#F7DC6F',
    CALVES:      '#82E0AA',
    ABS:         '#F0B27A',
    FOREARMS:    '#AED6F1',
    TRAPS:       '#C39BD3',
    LATS:        '#76D7C4',
    FULL_BODY:   '#F8C471',
  },
} as const;

// ── Gradients ─────────────────────────────────────────────────────────────
export type GradientTuple = readonly [string, string, ...string[]];
export const Gradients: Record<string, GradientTuple> = {
  primary:       ['#0A84FF', '#0059B3'],
  primarySoft:   ['rgba(10,132,255,0.2)', 'rgba(10,132,255,0.05)'],
  accent:        ['#FF9F0A', '#FFD60A'],
  accentSoft:    ['rgba(255,159,10,0.2)', 'rgba(255,214,10,0.05)'],
  streak:        ['#FF9F0A', '#FFD60A'],
  success:       ['#30D158', '#249E43'],
  cardShine:     ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)'],
  hero:          ['#000000', '#1C1C1E'],
  dark:          ['#1C1C1E', '#000000'],
  trainingDay:   ['#FF9F0A', '#FF7A00'],
  restDay:       ['#5E5CE6', '#BF5AF2'],
};

// ── Spacing ───────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
} as const;

// ── Radius ────────────────────────────────────────────────────────────────
export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 9999,
} as const;

// ── Font Size ─────────────────────────────────────────────────────────────
export const FontSize = {
  xxs:  10,
  xs:   12,
  sm:   14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 34,
  hero: 42,
} as const;

// ── Font Weight ───────────────────────────────────────────────────────────
export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
};

// ── Shadows (iOS) ─────────────────────────────────────────────────────────
export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
  glow: (color: string) => Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
} as const;
