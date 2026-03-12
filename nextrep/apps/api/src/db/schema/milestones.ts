import { pgTable, uuid, text, real, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { exercises } from './exercises';
import { workoutSessions } from './workoutSessions';

export const milestoneTypeEnum = pgEnum('milestone_type', [
  'WORKOUT_COUNT',
  'STREAK',
  'PR',
  'TOTAL_VOLUME',
  'BODY_WEIGHT',
  'EXERCISE_MASTERY',
  'CONSISTENCY',
]);

export const milestones = pgTable('milestones', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              milestoneTypeEnum('type').notNull(),
  title:             text('title').notNull(),
  description:       text('description'),
  value:             real('value'),
  achievedAt:        timestamp('achieved_at', { withTimezone: true }).notNull().defaultNow(),
  isShared:          boolean('is_shared').notNull().default(false),
  relatedExerciseId: uuid('related_exercise_id').references(() => exercises.id),
  relatedSessionId:  uuid('related_session_id').references(() => workoutSessions.id),
  metadata:          jsonb('metadata'),
});

export const milestonesRelations = relations(milestones, ({ one }) => ({
  user:    one(users,           { fields: [milestones.userId],            references: [users.id] }),
  exercise: one(exercises,      { fields: [milestones.relatedExerciseId], references: [exercises.id] }),
  session:  one(workoutSessions, { fields: [milestones.relatedSessionId], references: [workoutSessions.id] }),
}));

export type Milestone    = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
