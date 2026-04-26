import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { workoutSessions, workoutSets, personalRecords, exercises } from '../db/schema';

// ─── Dashboard Overview ────────────────────────────────────────────────────────
export async function getDashboardOverview(userId: string) {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false) AS total_workouts,
      (SELECT COALESCE(SUM(total_volume_kg),0) FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false) AS total_volume,
      (SELECT COUNT(*) FROM personal_records WHERE user_id = ${userId}) AS total_prs,
      (SELECT COALESCE(SUM(total_sets),0) FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false) AS total_sets,
      (SELECT AVG(duration_seconds) / 60.0 FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false AND total_sets > 0 AND duration_seconds > 0) AS avg_duration,
      (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ${userId} AND is_deleted = false AND started_at >= NOW() - INTERVAL '30 days') AS workouts_this_month
  `);
  const r = result.rows[0] as any;
  return {
    totalWorkouts:    Number(r.total_workouts),
    totalVolumeKg:    Number(r.total_volume),
    totalPrs:         Number(r.total_prs),
    totalSets:        Number(r.total_sets),
    avgDurationMin:   r.avg_duration ? Math.round(Number(r.avg_duration)) : null,
    workoutsThisMonth:Number(r.workouts_this_month),
  };
}

// ─── Strength Curve (max weight per date for an exercise) ─────────────────────
export async function getStrengthCurve(userId: string, exerciseId: string, days = 90) {
  const result = await db.execute(sql`
    SELECT
      DATE(s.started_at) AS date,
      MAX(ws.weight_kg) AS max_weight,
      MAX(ws.estimated_1rm) AS max_1rm
    FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    WHERE s.user_id = ${userId}
      AND ws.exercise_id = ${exerciseId}
      AND s.is_deleted = false
      AND s.started_at >= NOW() - MAKE_INTERVAL(days => ${Math.max(1, Math.min(days, 3650))})
    GROUP BY DATE(s.started_at)
    ORDER BY date
  `);
  return result.rows.map((r: any) => ({
    date:      new Date(r.date).toISOString(),
    weight:    r.max_weight !== null ? Number(r.max_weight) : null,
    estimated1rm: r.max_1rm !== null ? Number(r.max_1rm) : null,
  }));
}

// ─── Volume Trend (total volume per week) ─────────────────────────────────────
export async function getVolumeTrend(userId: string, weeks = 12) {
  const result = await db.execute(sql`
    SELECT
      DATE_TRUNC('week', started_at) AS week,
      SUM(total_volume_kg) AS volume
    FROM workout_sessions
    WHERE user_id = ${userId}
      AND is_deleted = false
      AND started_at >= NOW() - MAKE_INTERVAL(weeks => ${Math.max(1, Math.min(weeks, 520))})
    GROUP BY week
    ORDER BY week
  `);
  return result.rows.map((r: any) => ({
    week:   new Date(r.week).toISOString(),
    volume: Number(r.volume),
  }));
}

// ─── Frequency Heatmap (workout count per day of week × hour) ─────────────────
export async function getFrequencyHeatmap(userId: string) {
  const result = await db.execute(sql`
    SELECT
      EXTRACT(DOW FROM started_at)  AS dow,
      EXTRACT(HOUR FROM started_at) AS hour,
      COUNT(*)                       AS count
    FROM workout_sessions
    WHERE user_id = ${userId} AND is_deleted = false
    GROUP BY dow, hour
    ORDER BY dow, hour
  `);
  return result.rows.map((r: any) => ({
    dayOfWeek: Number(r.dow),
    hour:      Number(r.hour),
    count:     Number(r.count),
  }));
}

// ─── Tonnage (weekly per muscle group) ────────────────────────────────────────
export async function getMuscleVolume(userId: string, weeks = 8) {
  const result = await db.execute(sql`
    SELECT
      e.primary_muscle AS muscle_group,
      DATE_TRUNC('week', s.started_at) AS week,
      SUM(ws.weight_kg * ws.reps) AS tonnage
    FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    JOIN exercises e ON ws.exercise_id = e.id
    WHERE s.user_id = ${userId}
      AND s.is_deleted = false
      AND s.started_at >= NOW() - MAKE_INTERVAL(weeks => ${Math.max(1, Math.min(weeks, 520))})
    GROUP BY e.primary_muscle, week
    ORDER BY week, e.primary_muscle
  `);
  return result.rows.map((r: any) => ({
    muscleGroup: r.muscle_group,
    week:        new Date(r.week).toISOString(),
    tonnage:     Number(r.tonnage),
  }));
}

// ─── Muscle Balance (total volume per muscle group) ───────────────────────────
export async function getMuscleBalance(userId: string, days = 30) {
  const result = await db.execute(sql`
    SELECT
      e.primary_muscle AS muscle_group,
      SUM(ws.weight_kg * ws.reps) AS volume
    FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    JOIN exercises e ON ws.exercise_id = e.id
    WHERE s.user_id = ${userId}
      AND s.is_deleted = false
      AND s.started_at >= NOW() - MAKE_INTERVAL(days => ${Math.max(1, Math.min(days, 3650))})
    GROUP BY e.primary_muscle
    ORDER BY volume DESC
  `);
  return result.rows.map((r: any) => ({
    muscleGroup: r.muscle_group,
    volume:      Number(r.volume),
  }));
}

// ─── Duration Trend ───────────────────────────────────────────────────────────
export async function getDurationTrend(userId: string, weeks = 12) {
  const result = await db.execute(sql`
    SELECT
      DATE(started_at) AS date,
      ROUND(duration_seconds / 60.0) AS duration_minutes
    FROM workout_sessions
    WHERE user_id = ${userId}
      AND is_deleted = false
      AND duration_seconds > 0
      AND started_at >= NOW() - MAKE_INTERVAL(weeks => ${Math.max(1, Math.min(weeks, 520))})
    ORDER BY date
  `);
  return result.rows.map((r: any) => ({
    date:     new Date(r.date).toISOString(),
    duration: Number(r.duration_minutes),
  }));
}

// ─── Personal Records Board ───────────────────────────────────────────────────
export async function getRecordsBoard(userId: string) {
  const result = await db.execute(sql`
    SELECT
      pr.exercise_id,
      e.name AS exercise_name,
      e.primary_muscle AS muscle_group,
      pr.record_type,
      pr.value,
      pr.achieved_at
    FROM personal_records pr
    JOIN exercises e ON pr.exercise_id = e.id
    WHERE pr.user_id = ${userId}
    ORDER BY e.name, pr.record_type
  `);
  return result.rows.map((r: any) => ({
    exerciseId:   r.exercise_id,
    exerciseName: r.exercise_name,
    muscleGroup:  r.muscle_group,
    recordType:   r.record_type,
    value:        Number(r.value),
    achievedAt:   new Date(r.achieved_at).toISOString(),
  }));
}
