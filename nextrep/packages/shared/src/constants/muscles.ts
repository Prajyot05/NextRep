import type { MuscleGroup } from '../types/exercise';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS',
  'FOREARMS', 'TRAPS', 'LATS', 'FULL_BODY',
];

export const MUSCLE_DISPLAY_NAMES: Record<MuscleGroup, string> = {
  CHEST:      'Chest',
  BACK:       'Back',
  SHOULDERS:  'Shoulders',
  BICEPS:     'Biceps',
  TRICEPS:    'Triceps',
  QUADS:      'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES:     'Glutes',
  CALVES:     'Calves',
  ABS:        'Abs',
  FOREARMS:   'Forearms',
  TRAPS:      'Traps',
  LATS:       'Lats',
  FULL_BODY:  'Full Body',
};

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  CHEST:      '#4A90FF',
  BACK:       '#34D399',
  SHOULDERS:  '#FBBF24',
  BICEPS:     '#F87171',
  TRICEPS:    '#A78BFA',
  QUADS:      '#FB923C',
  HAMSTRINGS: '#22D3EE',
  GLUTES:     '#F472B6',
  CALVES:     '#84CC16',
  ABS:        '#E879F9',
  FOREARMS:   '#06B6D4',
  TRAPS:      '#EF4444',
  LATS:       '#10B981',
  FULL_BODY:  '#6366F1',
};
