import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { templateExercises } from './templateExercises';

export const workoutTemplates = pgTable('workout_templates', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  userId:               uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:                 text('name').notNull(),
  description:          text('description'),
  targetMuscles:        text('target_muscles').array().default([]).notNull(),
  estimatedDurationMin: integer('estimated_duration_min'),
  sortOrder:            integer('sort_order').notNull().default(0),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isArchived:           boolean('is_archived').notNull().default(false),
});

export const workoutTemplatesRelations = relations(workoutTemplates, ({ one, many }) => ({
  user:      one(users, { fields: [workoutTemplates.userId], references: [users.id] }),
  exercises: many(templateExercises),
}));

export type WorkoutTemplate    = typeof workoutTemplates.$inferSelect;
export type NewWorkoutTemplate = typeof workoutTemplates.$inferInsert;
