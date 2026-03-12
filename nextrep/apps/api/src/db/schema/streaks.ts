import { pgTable, uuid, integer, smallint, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const userStreaks = pgTable('user_streaks', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentStreak:   integer('current_streak').notNull().default(0),
  longestStreak:   integer('longest_streak').notNull().default(0),
  lastWorkoutDate: date('last_workout_date'),
  streakStartDate: date('streak_start_date'),
  weeklyGoal:      smallint('weekly_goal').notNull().default(4),
  freezeDaysLeft:  smallint('freeze_days_left').notNull().default(1),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const streakHistory = pgTable('streak_history', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date:       date('date').notNull(),
  hasWorkout: boolean('has_workout').notNull().default(false),
  wasFrozen:  boolean('was_frozen').notNull().default(false),
  streakDay:  integer('streak_day').notNull().default(0),
});

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, { fields: [userStreaks.userId], references: [users.id] }),
}));

export const streakHistoryRelations = relations(streakHistory, ({ one }) => ({
  user: one(users, { fields: [streakHistory.userId], references: [users.id] }),
}));

export type UserStreak      = typeof userStreaks.$inferSelect;
export type NewUserStreak   = typeof userStreaks.$inferInsert;
export type StreakHistoryRow = typeof streakHistory.$inferSelect;
