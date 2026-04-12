export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'ABS'
  | 'FOREARMS'
  | 'TRAPS'
  | 'LATS'
  | 'FULL_BODY';

export type ExerciseCategory =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'BAND'
  | 'KETTLEBELL'
  | 'CARDIO'
  | 'OTHER';

export interface Exercise {
  id: string;
  userId: string | null;
  catalogId: string | null;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: ExerciseCategory;
  equipment: string | null;
  instructions: string | null;
  imageUrl: string | null;
  level: string | null;
  force: string | null;
  mechanic: string | null;
  isCustom: boolean;
  createdAt: string;
  isArchived: boolean;
}

export type CreateExerciseInput = Pick<
  Exercise,
  'name' | 'primaryMuscle' | 'secondaryMuscles' | 'category' | 'equipment' | 'instructions'
> & {
  catalogId?: string;
  imageUrl?: string;
  level?: string;
  force?: string;
  mechanic?: string;
};
