import { pgTable, uuid, smallint, real, integer, boolean, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workoutSessions } from './workoutSessions';
import { exercises } from './exercises';

export const setTypeEnum = pgEnum('set_type', ['WARMUP', 'WORKING', 'DROPSET', 'FAILURE', 'AMRAP']);

export const workoutSets = pgTable('workout_sets', {
  id:              uuid('id').primaryKey().defaultRandom(),
  sessionId:       uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId:      uuid('exercise_id').notNull().references(() => exercises.id),
  setNumber:       smallint('set_number').notNull(),
  type:            setTypeEnum('type').notNull().default('WORKING'),
  weightKg:        real('weight_kg'),
  reps:            smallint('reps'),
  durationSeconds: integer('duration_seconds'),
  distanceMeters:  real('distance_meters'),
  rpe:             real('rpe'),
  estimated1rm:    real('estimated_1rm'),
  isPr:            boolean('is_pr').default(false),
  prTypes:         text('pr_types').array().default([]).notNull(),
  notes:           text('notes'),
  completedAt:     timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session:  one(workoutSessions, { fields: [workoutSets.sessionId],  references: [workoutSessions.id] }),
  exercise: one(exercises,       { fields: [workoutSets.exerciseId], references: [exercises.id] }),
}));

export type WorkoutSet    = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
