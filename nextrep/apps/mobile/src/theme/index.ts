// ─── NextRep Design System ─────────────────────────────────────────────────
// "Dark Athletic Premium" — inspired by Hevy, Strong, Nike Training Club

import { Platform } from 'react-native';

// ── Colors ────────────────────────────────────────────────────────────────
export const Colors = {
  // Brand — cyan-to-blue primary
  primary:       '#00D4FF',
  primaryLight:  '#5CE1FF',
  primaryDark:   '#0099CC',
  primaryMuted:  'rgba(0, 212, 255, 0.15)',

  // Accent — ember-orange for energy & CTAs
  accent:        '#FF6B35',
  accentLight:   '#FF8A5C',
  accentMuted:   'rgba(255, 107, 53, 0.15)',

  // Semantic
  success:       '#00E676',
  successMuted:  'rgba(0, 230, 118, 0.15)',
  warning:       '#FFD600',
  warningMuted:  'rgba(255, 214, 0, 0.15)',
  error:         '#FF5252',
  errorMuted:    'rgba(255, 82, 82, 0.15)',

  // Streak
  streak:        '#FF6B35',
  streakGold:    '#FFD700',
  streakMuted:   'rgba(255, 107, 53, 0.12)',

  // Background — deep obsidian
  bg:            '#0A0A0F',
  bgElevated:    '#12121A',
  bgCard:        '#1A1A24',
  bgCardHover:   '#22222E',
  bgMuted:       '#2A2A36',
  bgOverlay:     'rgba(0, 0, 0, 0.75)',

  // Text
  text:          '#F0F0F5',
  textSecondary: '#B0B0C0',
  textMuted:     '#6E6E82',
  textDisabled:  '#3E3E52',

  // Border
  border:        'rgba(255, 255, 255, 0.08)',
  borderSubtle:  'rgba(255, 255, 255, 0.04)',
  borderFocus:   '#00D4FF',

  // Muscle group colors (for charts)
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
  primary:       ['#00D4FF', '#0066FF'],
  primarySoft:   ['rgba(0,212,255,0.2)', 'rgba(0,102,255,0.05)'],
  accent:        ['#FF6B35', '#FF3D00'],
  accentSoft:    ['rgba(255,107,53,0.2)', 'rgba(255,61,0,0.05)'],
  streak:        ['#FF6B35', '#FFD700'],
  success:       ['#00E676', '#00C853'],
  cardShine:     ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)'],
  hero:          ['#0A0A0F', '#12121A', '#1A1A24'],
  dark:          ['#12121A', '#0A0A0F'],
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
  md:   14,
  lg:   20,
  xl:   28,
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
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
    android: { elevation: 8 },
  }),
  glow: (color: string) => Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12 },
    android: { elevation: 6 },
  }),
} as const;
