import { pgTable, uuid, real, text, date, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const bodyMeasurements = pgTable('body_measurements', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date:          date('date').notNull(),
  weightKg:      real('weight_kg'),
  bodyFatPct:    real('body_fat_pct'),
  chestCm:       real('chest_cm'),
  waistCm:       real('waist_cm'),
  hipsCm:        real('hips_cm'),
  leftArmCm:     real('left_arm_cm'),
  rightArmCm:    real('right_arm_cm'),
  leftThighCm:   real('left_thigh_cm'),
  rightThighCm:  real('right_thigh_cm'),
  neckCm:        real('neck_cm'),
  notes:         text('notes'),
  photoUrl:      text('photo_url'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
  user: one(users, { fields: [bodyMeasurements.userId], references: [users.id] }),
}));

export type BodyMeasurement    = typeof bodyMeasurements.$inferSelect;
export type NewBodyMeasurement = typeof bodyMeasurements.$inferInsert;
