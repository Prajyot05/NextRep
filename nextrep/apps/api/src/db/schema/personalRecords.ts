import { pgTable, uuid, real, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { exercises } from './exercises';
import { workoutSessions } from './workoutSessions';
import { workoutSets } from './workoutSets';

export const prTypeEnum = pgEnum('pr_type', ['MAX_WEIGHT', 'MAX_REPS', 'MAX_VOLUME', 'ESTIMATED_1RM']);

export const personalRecords = pgTable('personal_records', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId:    uuid('exercise_id').notNull().references(() => exercises.id),
  recordType:    prTypeEnum('record_type').notNull(),
  value:         real('value').notNull(),
  achievedAt:    timestamp('achieved_at', { withTimezone: true }).notNull(),
  sessionId:     uuid('session_id').references(() => workoutSessions.id, { onDelete: 'set null' }),
  setId:         uuid('set_id').references(() => workoutSets.id, { onDelete: 'set null' }),
  previousValue: real('previous_value'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  user:     one(users,            { fields: [personalRecords.userId],     references: [users.id] }),
  exercise: one(exercises,        { fields: [personalRecords.exerciseId], references: [exercises.id] }),
  session:  one(workoutSessions,  { fields: [personalRecords.sessionId],  references: [workoutSessions.id] }),
  set:      one(workoutSets,      { fields: [personalRecords.setId],      references: [workoutSets.id] }),
}));

export type PersonalRecord    = typeof personalRecords.$inferSelect;
export type NewPersonalRecord = typeof personalRecords.$inferInsert;
