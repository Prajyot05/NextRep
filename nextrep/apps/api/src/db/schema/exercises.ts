import { pgTable, uuid, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const muscleGroupEnum = pgEnum('muscle_group', [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS',
  'FOREARMS', 'TRAPS', 'LATS', 'FULL_BODY',
]);

export const exerciseCategoryEnum = pgEnum('exercise_category', [
  'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE',
  'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'CARDIO', 'OTHER',
]);

export const exercises = pgTable('exercises', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  catalogId:        text('catalog_id').unique(),
  name:             text('name').notNull(),
  primaryMuscle:    muscleGroupEnum('primary_muscle').notNull(),
  secondaryMuscles: text('secondary_muscles').array().default([]).notNull(),
  category:         exerciseCategoryEnum('category').notNull(),
  equipment:        text('equipment'),
  instructions:     text('instructions'),
  imageUrl:         text('image_url'),
  level:            text('level'),
  force:            text('force'),
  mechanic:         text('mechanic'),
  isCustom:         boolean('is_custom').notNull().default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  isArchived:       boolean('is_archived').notNull().default(false),
});

export const exercisesRelations = relations(exercises, ({ one }) => ({
  user: one(users, { fields: [exercises.userId], references: [users.id] }),
}));

export type Exercise    = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
