import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { workoutSets, workoutSessions, exercises, personalRecords } from '../db/schema';
import type { WorkoutSet } from '../db/schema';

type PrType = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_VOLUME' | 'ESTIMATED_1RM';

interface PrUpdate {
  exerciseId: string;
  type: PrType;
  value: number;
  setId: string;
  sessionId: string;
  achievedAt: Date;
}

export async function processPrs(userId: string, sessionId: string, sets: WorkoutSet[]) {
  // Only process working sets (not warmups)
  const workingSets = sets.filter((s) => s.type === 'WORKING' || s.type === 'FAILURE' || s.type === 'AMRAP');
  if (workingSets.length === 0) return;

  // Group by exercise
  const byExercise = new Map<string, WorkoutSet[]>();
  for (const s of workingSets) {
    const list = byExercise.get(s.exerciseId) ?? [];
    list.push(s);
    byExercise.set(s.exerciseId, list);
  }

  const prUpdates: PrUpdate[] = [];
  const prSetIds = new Set<string>();

  for (const [exerciseId, exSets] of byExercise.entries()) {
    // Fetch current PRs for this exercise
    const currentPrs = await db.query.personalRecords.findMany({
      where: and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId),
      ),
    });
    const prMap = new Map(currentPrs.map((p) => [p.recordType, p]));

    // Check each PR type
    // 1. MAX_WEIGHT
    const heaviestSet = exSets.reduce<WorkoutSet | null>((best, s) => {
      if (!s.weightKg) return best;
      return !best || s.weightKg > (best.weightKg ?? 0) ? s : best;
    }, null);
    if (heaviestSet?.weightKg) {
      const current = prMap.get('MAX_WEIGHT');
      if (!current || heaviestSet.weightKg > current.value) {
        prUpdates.push({ exerciseId, type: 'MAX_WEIGHT', value: heaviestSet.weightKg, setId: heaviestSet.id, sessionId, achievedAt: heaviestSet.completedAt });
        prSetIds.add(heaviestSet.id);
      }
    }

    // 2. MAX_REPS (at any weight)
    const mostRepsSet = exSets.reduce<WorkoutSet | null>((best, s) => {
      if (!s.reps) return best;
      return !best || s.reps > (best.reps ?? 0) ? s : best;
    }, null);
    if (mostRepsSet?.reps) {
      const current = prMap.get('MAX_REPS');
      if (!current || mostRepsSet.reps > current.value) {
        prUpdates.push({ exerciseId, type: 'MAX_REPS', value: mostRepsSet.reps, setId: mostRepsSet.id, sessionId, achievedAt: mostRepsSet.completedAt });
        prSetIds.add(mostRepsSet.id);
      }
    }

    // 3. MAX_VOLUME (single set)
    const maxVolumeSet = exSets.reduce<WorkoutSet | null>((best, s) => {
      if (!s.weightKg || !s.reps) return best;
      const vol = s.weightKg * s.reps;
      const bestVol = best?.weightKg && best.reps ? best.weightKg * best.reps : 0;
      return vol > bestVol ? s : best;
    }, null);
    if (maxVolumeSet?.weightKg && maxVolumeSet.reps) {
      const vol = maxVolumeSet.weightKg * maxVolumeSet.reps;
      const current = prMap.get('MAX_VOLUME');
      if (!current || vol > current.value) {
        prUpdates.push({ exerciseId, type: 'MAX_VOLUME', value: vol, setId: maxVolumeSet.id, sessionId, achievedAt: maxVolumeSet.completedAt });
        prSetIds.add(maxVolumeSet.id);
      }
    }

    // 4. ESTIMATED_1RM
    const best1rmSet = exSets.reduce<WorkoutSet | null>((best, s) => {
      if (!s.estimated1rm) return best;
      return !best || s.estimated1rm > (best.estimated1rm ?? 0) ? s : best;
    }, null);
    if (best1rmSet?.estimated1rm) {
      const current = prMap.get('ESTIMATED_1RM');
      if (!current || best1rmSet.estimated1rm > current.value) {
        prUpdates.push({ exerciseId, type: 'ESTIMATED_1RM', value: best1rmSet.estimated1rm, setId: best1rmSet.id, sessionId, achievedAt: best1rmSet.completedAt });
        prSetIds.add(best1rmSet.id);
      }
    }
  }

  // Upsert PRs
  for (const update of prUpdates) {
    const current = await db.query.personalRecords.findFirst({
      where: and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, update.exerciseId),
        eq(personalRecords.recordType, update.type),
      ),
    });

    await db
      .insert(personalRecords)
      .values({
        userId,
        exerciseId:    update.exerciseId,
        recordType:    update.type,
        value:         update.value,
        achievedAt:    update.achievedAt,
        sessionId:     update.sessionId,
        setId:         update.setId,
        previousValue: current?.value ?? null,
      })
      .onConflictDoUpdate({
        target:        [personalRecords.userId, personalRecords.exerciseId, personalRecords.recordType],
        set: {
          value:         update.value,
          achievedAt:    update.achievedAt,
          sessionId:     update.sessionId,
          setId:         update.setId,
          previousValue: current?.value ?? null,
        },
        where:         sql`${personalRecords.value} < ${update.value}`,
      });
  }

  // Mark sets that are PRs
  if (prSetIds.size > 0) {
    for (const setId of prSetIds) {
      const setObj = sets.find((s) => s.id === setId);
      if (!setObj) continue;
      const prTypes = prUpdates.filter((p) => p.setId === setId).map((p) => p.type);
      await db
        .update(workoutSets)
        .set({ isPr: true, prTypes })
        .where(eq(workoutSets.id, setId));
    }
  }
}
