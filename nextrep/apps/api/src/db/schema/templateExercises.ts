import { pgTable, uuid, integer, real, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workoutTemplates } from './workoutTemplates';
import { exercises } from './exercises';

export const templateExercises = pgTable('template_exercises', {
  id:            uuid('id').primaryKey().defaultRandom(),
  templateId:    uuid('template_id').notNull().references(() => workoutTemplates.id, { onDelete: 'cascade' }),
  exerciseId:    uuid('exercise_id').notNull().references(() => exercises.id),
  orderIndex:    integer('order_index').notNull(),
  targetSets:    integer('target_sets').default(3),
  targetRepsMin: integer('target_reps_min').default(8),
  targetRepsMax: integer('target_reps_max').default(12),
  targetRpe:     real('target_rpe'),
  restSeconds:   integer('rest_seconds').default(90),
  supersetGroup: integer('superset_group'),
  notes:         text('notes'),
});

export const templateExercisesRelations = relations(templateExercises, ({ one }) => ({
  template: one(workoutTemplates, { fields: [templateExercises.templateId], references: [workoutTemplates.id] }),
  exercise: one(exercises,        { fields: [templateExercises.exerciseId], references: [exercises.id] }),
}));

export type TemplateExercise    = typeof templateExercises.$inferSelect;
export type NewTemplateExercise = typeof templateExercises.$inferInsert;
