// Theme constants for NextRep
export const Colors = {
  // Brand
  primary:       '#4A90FF',
  primaryLight:  '#6BA7FF',
  primaryDark:   '#2E6FD9',

  // Accent
  accent:        '#FF6B35',
  accentLight:   '#FF8A5C',

  // Success / Warning / Error
  success:       '#34D399',
  warning:       '#FBBF24',
  error:         '#F87171',

  // Streak colors
  streak:        '#FF6B35',
  streakGold:    '#FFD700',

  // Background (dark-first)
  bg:            '#09090b',
  bgCard:        '#18181b',
  bgMuted:       '#27272a',
  bgOverlay:     'rgba(0,0,0,0.7)',

  // Text
  text:          '#fafafa',
  textMuted:     '#a1a1aa',
  textDisabled:  '#52525b',

  // Border
  border:        '#3f3f46',
  borderFocus:   '#4A90FF',

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

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 30,
  hero: 40,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  black:     '900' as const,
};
