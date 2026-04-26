import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { workoutSessions, workoutSets, exercises } from '../db/schema';
import { estimate1rm } from '@nextrep/shared';
import { processPrs } from './prService';
import { updateStreak } from './streakService';
import { checkMilestones } from './milestoneService';
import type { CreateSessionInput } from '@nextrep/shared';

export async function createSession(userId: string, input: CreateSessionInput) {
  // Calculate summary stats
  const sets = input.sets.filter((s) => s.type !== 'WARMUP');
  const totalVolumeKg = sets.reduce((sum, s) => {
    if (s.weightKg && s.reps) return sum + s.weightKg * s.reps;
    return sum;
  }, 0);

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      templateId:      input.templateId ?? null,
      name:            input.name,
      startedAt:       new Date(input.startedAt),
      finishedAt:      new Date(input.finishedAt),
      durationSeconds: input.durationSeconds,
      totalVolumeKg,
      totalSets:       sets.length,
      notes:           input.notes ?? null,
      rating:          input.rating ?? null,
    })
    .returning();

  // Insert all sets with estimated 1RM
  const setsToInsert = input.sets.map((s) => ({
    sessionId:       session.id,
    exerciseId:      s.exerciseId,
    setNumber:       s.setNumber,
    type:            s.type,
    weightKg:        s.weightKg ?? null,
    reps:            s.reps ?? null,
    durationSeconds: s.durationSeconds ?? null,
    distanceMeters:  s.distanceMeters ?? null,
    rpe:             s.rpe ?? null,
    estimated1rm:    s.weightKg && s.reps ? estimate1rm(s.weightKg, s.reps) : null,
    completedAt:     new Date(s.completedAt),
    prTypes:         [] as string[],
  }));

  const insertedSets = await db.insert(workoutSets).values(setsToInsert).returning();

  // Update PRs (fired async — don't block response)
  processPrs(userId, session.id, insertedSets).catch(console.error);

  // Update streak
  updateStreak(userId, new Date(input.finishedAt)).catch(console.error);

  // Check milestones
  checkMilestones(userId, session.id).catch(console.error);

  return {
    ...session,
    sets: insertedSets,
  };
}

export async function syncSessions(userId: string, sessions: CreateSessionInput[]) {
  const results: Array<{ status: 'ok' | 'error'; error?: string }> = [];
  for (const s of sessions) {
    try {
      await createSession(userId, s);
      results.push({ status: 'ok' });
    } catch (err) {
      results.push({ status: 'error', error: String(err) });
    }
  }
  return { pushed: results.filter((r) => r.status === 'ok').length, failed: results.filter((r) => r.status === 'error').length };
}

export async function getSessionById(userId: string, sessionId: string) {
  const session = await db.query.workoutSessions.findFirst({
    where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId), eq(workoutSessions.isDeleted, false)),
    with: {
      sets: {
        orderBy: [workoutSets.setNumber],
        with: { exercise: true },
      },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  return session;
}

export async function listSessions(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const [rows, countResult] = await Promise.all([
    db.query.workoutSessions.findMany({
      where: and(eq(workoutSessions.userId, userId), eq(workoutSessions.isDeleted, false)),
      orderBy: [desc(workoutSessions.startedAt)],
      limit,
      offset,
    }),
    db.select({ total: sql<number>`count(*)` })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.isDeleted, false))),
  ]);
  return { data: rows, total: Number(countResult[0]?.total ?? 0), page, limit };
}

export async function deleteSession(userId: string, sessionId: string) {
  const [updated] = await db
    .update(workoutSessions)
    .set({ isDeleted: true })
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
    .returning();
  if (!updated) throw Object.assign(new Error('Session not found'), { status: 404 });
  return updated;
}

export async function getCalendar(userId: string) {
  // Returns rich calendar data with session + exercise + set details
  const rows = await db.execute(
    sql`
      SELECT
        ws.started_at::date::text AS date,
        COALESCE(json_agg(DISTINCT e.primary_muscle) FILTER (WHERE e.primary_muscle IS NOT NULL), '[]'::json) AS muscles,
        ws.id AS session_id,
        ws.name AS session_name,
        ws.total_volume_kg,
        ws.total_sets,
        ws.duration_seconds
      FROM workout_sessions ws
      JOIN workout_sets s ON s.session_id = ws.id
      JOIN exercises e ON e.id = s.exercise_id
      WHERE ws.user_id = ${userId}
        AND ws.is_deleted = false
        AND ws.started_at >= now() - INTERVAL '6 months'
      GROUP BY ws.started_at::date, ws.id
      ORDER BY ws.started_at::date
    `,
  );
  return rows.rows;
}

export async function getSessionSummary(userId: string, sessionId: string) {
  // Returns a compact workout summary with exercises + sets for calendar popup
  const session = await db.query.workoutSessions.findFirst({
    where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId), eq(workoutSessions.isDeleted, false)),
    with: {
      sets: {
        orderBy: [workoutSets.setNumber],
        with: { exercise: true },
      },
    },
  });
  if (!session) return null;

  // Group sets by exercise
  const exerciseMap: Record<string, { name: string; primaryMuscle: string; sets: Array<{ setNumber: number; weightKg: number | null; reps: number | null; type: string; isPr: boolean }> }> = {};
  for (const s of session.sets) {
    if (!exerciseMap[s.exerciseId]) {
      exerciseMap[s.exerciseId] = {
        name: s.exercise?.name ?? 'Unknown',
        primaryMuscle: s.exercise?.primaryMuscle ?? '',
        sets: [],
      };
    }
    exerciseMap[s.exerciseId].sets.push({
      setNumber: s.setNumber,
      weightKg: s.weightKg,
      reps: s.reps,
      type: s.type,
      isPr: s.isPr ?? false,
    });
  }

  return {
    id: session.id,
    name: session.name,
    startedAt: session.startedAt,
    durationSeconds: session.durationSeconds,
    totalVolumeKg: session.totalVolumeKg,
    totalSets: session.totalSets,
    notes: session.notes,
    rating: session.rating,
    exercises: Object.values(exerciseMap),
  };
}
