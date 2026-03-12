export type SetType = 'WARMUP' | 'WORKING' | 'DROPSET' | 'FAILURE' | 'AMRAP';

export type PrTypeFlag = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_VOLUME' | 'ESTIMATED_1RM';

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  estimated1rm: number | null;
  isPr: boolean;
  prTypes: PrTypeFlag[];
  notes: string | null;
  completedAt: string;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId: string | null;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalVolumeKg: number;
  totalSets: number;
  notes: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  sets?: WorkoutSetWithExercise[];
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exerciseName: string;
  primaryMuscle: string;
}

export interface CreateSessionInput {
  templateId?: string;
  name: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  notes?: string;
  rating?: number;
  sets: CreateSetInput[];
}

export interface CreateSetInput {
  exerciseId: string;
  setNumber: number;
  type: SetType;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  rpe?: number;
  notes?: string;
  completedAt: string;
}
