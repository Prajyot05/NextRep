import { z } from 'zod';

const SetTypeEnum = z.enum(['WARMUP', 'WORKING', 'DROPSET', 'FAILURE', 'AMRAP']);

export const CreateSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  type: SetTypeEnum.default('WORKING'),
  weightKg: z.number().min(0).max(2000).optional(),
  reps: z.number().int().min(0).max(10000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceMeters: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
  completedAt: z.string().datetime(),
});

export const CreateSessionSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
  durationSeconds: z.number().int().min(0),
  notes: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sets: z.array(CreateSetSchema).min(1, 'Workout must have at least 1 set'),
});

export const SyncPayloadSchema = z.object({
  sessions: z.array(CreateSessionSchema).min(1).max(100),
});

const TemplateExerciseInputSchema = z.object({
  exerciseId:       z.string().uuid(),
  defaultSets:      z.number().int().min(1).optional(),
  defaultReps:      z.number().int().min(1).optional(),
  defaultWeightKg:  z.number().min(0).optional(),
  restSeconds:      z.number().int().min(0).optional(),
  supersetGroup:    z.number().int().optional(),
});

export const CreateTemplateSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  exercises:   z.array(TemplateExerciseInputSchema).optional(),
});

export type SyncPayloadInput    = z.infer<typeof SyncPayloadSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
