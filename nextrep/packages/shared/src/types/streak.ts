export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakStartDate: string | null;
  weeklyGoal: number;
  freezeDaysLeft: number;
  updatedAt: string;
}

export interface StreakCalendarDay {
  date: string;
  hasWorkout: boolean;
  wasFrozen: boolean;
  streakDay: number;
}

export type MilestoneType =
  | 'WORKOUT_COUNT'
  | 'STREAK'
  | 'PR'
  | 'TOTAL_VOLUME'
  | 'BODY_WEIGHT'
  | 'EXERCISE_MASTERY'
  | 'CONSISTENCY';

export interface Milestone {
  id: string;
  userId: string;
  type: MilestoneType;
  title: string;
  description: string | null;
  value: number | null;
  achievedAt: string;
  isShared: boolean;
  relatedExerciseId: string | null;
  relatedSessionId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface StreakTier {
  days: number;
  label: string;
  emoji: string;
  color: string;
}

export const STREAK_TIERS: StreakTier[] = [
  { days: 7,   label: 'On Fire',      emoji: '🔥', color: '#FF6B35' },
  { days: 14,  label: 'Unstoppable',  emoji: '⚡', color: '#FFD700' },
  { days: 30,  label: 'Iron Will',    emoji: '💪', color: '#4A90FF' },
  { days: 60,  label: 'Beast Mode',   emoji: '🏆', color: '#A78BFA' },
  { days: 100, label: 'Gym Royalty',  emoji: '👑', color: '#34D399' },
  { days: 365, label: 'Diamond',      emoji: '💎', color: '#22D3EE' },
];
