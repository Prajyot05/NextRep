export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe: number | null;
  restSeconds: number;
  supersetGroup: number | null;
  notes: string | null;
  exerciseName?: string;
  primaryMuscle?: string;
  category?: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetMuscles: string[];
  estimatedDurationMin: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  exercises?: TemplateExercise[];
}

export type CreateTemplateInput = {
  name: string;
  description?: string;
  estimatedDurationMin?: number;
  exercises: Array<{
    exerciseId: string;
    orderIndex: number;
    targetSets?: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    targetRpe?: number;
    restSeconds?: number;
    supersetGroup?: number;
    notes?: string;
  }>;
};
