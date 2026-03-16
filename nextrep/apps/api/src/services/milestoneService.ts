import { eq, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { workoutSessions, milestones, workoutSets } from '../db/schema';
import { MilestoneType } from '@nextrep/shared';

interface MilestoneCheck {
  type: MilestoneType;
  value: number;
  thresholds: number[];
}

async function getWorkoutCount(userId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, userId));
  return Number(total);
}

async function getTotalVolume(userId: string): Promise<number> {
  const result = await db.execute(
    sql`SELECT COALESCE(SUM(total_volume_kg), 0) AS total FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false`,
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function getExerciseSets(userId: string, exerciseId: string): Promise<number> {
  const result = await db.execute(
    sql`SELECT COUNT(*) AS total FROM workout_sets ws
        JOIN workout_sessions s ON ws.session_id = s.id
        WHERE s.user_id = ${userId} AND ws.exercise_id = ${exerciseId}`,
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function alreadyAwarded(userId: string, type: MilestoneType, value: number): Promise<boolean> {
  const row = await db.query.milestones.findFirst({
    where: eq(milestones.userId, userId),
  });
  if (!row) return false;
  // Look for existing milestone with same type + threshold
  const existing = await db.execute(
    sql`SELECT id FROM milestones WHERE user_id = ${userId} AND type = ${type} AND (metadata->>'threshold')::int = ${value}`,
  );
  return existing.rows.length > 0;
}

async function awardMilestone(userId: string, sessionId: string, type: MilestoneType, value: number) {
  const already = await alreadyAwarded(userId, type, value);
  if (already) return;

  const titles: Record<string, string> = {
    WORKOUT_COUNT: `${value} Workouts Completed`,
    TOTAL_VOLUME:  `${value.toLocaleString()} kg Lifted`,
    EXERCISE_MASTERY: `Exercise Master`,
    STREAK:           `${value}-Day Streak`,
    PR_COUNT:         `${value} Personal Records`,
    CONSISTENCY:      `Consistent Athlete`,
  };

  await db.insert(milestones).values({
    userId,
    relatedSessionId: sessionId,
    type: type as any,
    title: titles[type] ?? type,
    achievedAt: new Date(),
    metadata: { threshold: value },
  });
}

export async function checkMilestones(userId: string, sessionId: string) {
  const [workoutCount, totalVolume] = await Promise.all([
    getWorkoutCount(userId),
    getTotalVolume(userId),
  ]);

  // Workout count thresholds
  for (const threshold of [10, 25, 50, 100, 250, 500]) {
    if (workoutCount >= threshold) {
      await awardMilestone(userId, sessionId, 'WORKOUT_COUNT', threshold);
    }
  }

  // Total volume thresholds (in kg)
  for (const threshold of [1000, 5000, 10000, 50000, 100000, 500000, 1000000]) {
    if (totalVolume >= threshold) {
      await awardMilestone(userId, sessionId, 'TOTAL_VOLUME', threshold);
    }
  }
}

export async function getUserMilestones(userId: string) {
  return db.query.milestones.findMany({
    where: eq(milestones.userId, userId),
    orderBy: (m, { desc }) => [desc(m.achievedAt)],
  });
}
