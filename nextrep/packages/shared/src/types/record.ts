export type PrType = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_VOLUME' | 'ESTIMATED_1RM';

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  recordType: PrType;
  value: number;
  achievedAt: string;
  sessionId: string | null;
  setId: string | null;
  previousValue: number | null;
  createdAt: string;
  exerciseName?: string;
  primaryMuscle?: string;
}

export interface RecordsBoard {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  maxWeight: number | null;
  maxReps: number | null;
  maxVolume: number | null;
  estimated1rm: number | null;
  maxWeightDate: string | null;
  maxRepsDate: string | null;
  maxVolumeDate: string | null;
  estimated1rmDate: string | null;
}
