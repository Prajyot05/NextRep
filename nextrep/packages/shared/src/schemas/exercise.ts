import { z } from 'zod';

const MuscleGroupEnum = z.enum([
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS',
  'FOREARMS', 'TRAPS', 'LATS', 'FULL_BODY',
]);

const ExerciseCategoryEnum = z.enum([
  'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE',
  'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'CARDIO', 'OTHER',
]);

export const CreateExerciseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  primaryMuscle: MuscleGroupEnum,
  secondaryMuscles: z.array(MuscleGroupEnum).default([]),
  category: ExerciseCategoryEnum,
  equipment: z.string().max(100).optional(),
  instructions: z.string().max(5000).optional(),
  catalogId: z.string().max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  level: z.string().max(50).optional(),
  force: z.string().max(50).optional(),
  mechanic: z.string().max(50).optional(),
});


