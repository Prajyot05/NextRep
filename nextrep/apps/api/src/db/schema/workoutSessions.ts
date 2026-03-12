import { pgTable, uuid, text, integer, real, timestamp, boolean, smallint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workoutTemplates } from './workoutTemplates';
import { workoutSets } from './workoutSets';

export const workoutSessions = pgTable('workout_sessions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId:      uuid('template_id').references(() => workoutTemplates.id, { onDelete: 'set null' }),
  name:            text('name').notNull(),
  startedAt:       timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt:      timestamp('finished_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  totalVolumeKg:   real('total_volume_kg').default(0),
  totalSets:       integer('total_sets').default(0),
  notes:           text('notes'),
  rating:          smallint('rating'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isDeleted:       boolean('is_deleted').notNull().default(false),
});

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user:     one(users,            { fields: [workoutSessions.userId],     references: [users.id] }),
  template: one(workoutTemplates, { fields: [workoutSessions.templateId], references: [workoutTemplates.id] }),
  sets:     many(workoutSets),
}));

export type WorkoutSession    = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
