import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { refreshTokens } from './refreshTokens';
import { workoutSessions } from './workoutSessions';
import { exercises } from './exercises';
import { workoutTemplates } from './workoutTemplates';
import { personalRecords } from './personalRecords';
import { bodyMeasurements } from './bodyMeasurements';
import { userStreaks } from './streaks';
import { milestones } from './milestones';

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName:  text('display_name'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  refreshTokens:    many(refreshTokens),
  workoutSessions:  many(workoutSessions),
  customExercises:  many(exercises),
  templates:        many(workoutTemplates),
  personalRecords:  many(personalRecords),
  bodyMeasurements: many(bodyMeasurements),
  streak:           one(userStreaks, { fields: [users.id], references: [userStreaks.userId] }),
  milestones:       many(milestones),
}));

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
