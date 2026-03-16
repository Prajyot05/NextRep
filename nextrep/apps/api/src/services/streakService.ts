import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { userStreaks, streakHistory } from '../db/schema';

export async function updateStreak(userId: string, workoutDate: Date) {
  const today = workoutDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Upsert streak record for this user
  let streak = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });

  if (!streak) {
    const [created] = await db
      .insert(userStreaks)
      .values({ userId, currentStreak: 0, longestStreak: 0 })
      .returning();
    streak = created;
  }

  const lastDate = streak.lastWorkoutDate;

  // Already counted this day
  const existing = await db.query.streakHistory.findFirst({
    where: and(eq(streakHistory.userId, userId), eq(streakHistory.date, today)),
  });

  // Check if this date is consecutive
  let newStreak = streak.currentStreak;

  if (!lastDate) {
    // First ever workout
    newStreak = 1;
  } else if (lastDate === today) {
    // Same day — second workout today, no change
    return;
  } else {
    const last = new Date(lastDate + 'T00:00:00Z');
    const curr = new Date(today + 'T00:00:00Z');
    const diffDays = Math.round((curr.getTime() - last.getTime()) / 86400000);

    if (diffDays === 1) {
      // Consecutive
      newStreak = streak.currentStreak + 1;
    } else if (diffDays === 2 && streak.freezeDaysLeft > 0) {
      // Missed one day — apply freeze
      newStreak = streak.currentStreak + 1;
      await db
        .update(userStreaks)
        .set({ freezeDaysLeft: streak.freezeDaysLeft - 1 })
        .where(eq(userStreaks.userId, userId));
      // Mark the missed day as frozen
      const missedDate = new Date(last.getTime() + 86400000).toISOString().split('T')[0];
      await db.insert(streakHistory).values({ userId, date: missedDate, hasWorkout: false, wasFrozen: true, streakDay: streak.currentStreak }).onConflictDoNothing();
    } else {
      // Streak broken — reset
      newStreak = 1;
    }
  }

  const newLongest = Math.max(newStreak, streak.longestStreak);

  await db
    .update(userStreaks)
    .set({
      currentStreak:   newStreak,
      longestStreak:   newLongest,
      lastWorkoutDate: today,
      streakStartDate: newStreak === 1 ? today : streak.streakStartDate,
      updatedAt:       new Date(),
    })
    .where(eq(userStreaks.userId, userId));

  // Record this day
  await db
    .insert(streakHistory)
    .values({ userId, date: today, hasWorkout: true, wasFrozen: false, streakDay: newStreak })
    .onConflictDoNothing();
}

export async function getStreak(userId: string) {
  const streak = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });
  if (!streak) return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, weeklyGoal: 4, freezeDaysLeft: 1 };
  return streak;
}

export async function getStreakCalendar(userId: string, months = 3) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const rows = await db.execute(
    sql`
      SELECT date, has_workout, was_frozen, streak_day
      FROM streak_history
      WHERE user_id = ${userId}
        AND date >= ${since.toISOString().split('T')[0]}
      ORDER BY date
    `,
  );
  return rows.rows;
}
