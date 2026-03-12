// Chart data shapes returned by the API

export interface StrengthDataPoint {
  date: string;
  estimated1rm: number;
  maxWeight: number;
  maxReps: number;
}

export interface VolumeByMuscle {
  week: string; // ISO week start date
  muscle: string;
  volumeKg: number;
  sets: number;
}

export interface FrequencyCell {
  week: string;
  muscle: string;
  sets: number;
  sessions: number;
}

export interface TonnagePoint {
  week: string;
  totalKg: number;
}

export interface DurationPoint {
  date: string;
  durationSeconds: number;
}

export interface MuscleBalancePoint {
  muscle: string;
  volumeKg: number;
  setsCount: number;
  normalizedScore: number; // 0-100
}

export interface CalendarDay {
  date: string;
  muscles: string[];
  sessionId: string | null;
}

export interface DashboardOverview {
  sessionsThisWeek: number;
  totalVolumeThisWeek: number;
  volumeChangeVsLastWeek: number; // percentage
  musclesTrainedToday: string[];
  currentStreak: number;
  prsThisMonth: number;
  mostTrainedMuscle: string | null;
  totalSessions: number;
  longestStreak: number;
  pendingSyncCount: number;
}
