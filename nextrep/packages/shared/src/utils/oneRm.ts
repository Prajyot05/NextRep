/**
 * 1RM Estimation formulas based on weight and reps.
 * Best used for 1–10 rep ranges.
 */

/** Epley formula — most common, good for heavy lifting */
export function epley1rm(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Brzycki formula — more accurate in 2–10 rep range */
export function brzycki1rm(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (36 / (37 - reps));
}

/** Lombardi formula — better at higher rep ranges */
export function lombardi1rm(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * Math.pow(reps, 0.1);
}

/** Average of Epley + Brzycki (our default estimate) */
export function estimate1rm(weightKg: number, reps: number): number {
  if (!weightKg || !reps || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const e = epley1rm(weightKg, reps);
  const b = brzycki1rm(weightKg, reps);
  return Math.round(((e + b) / 2) * 10) / 10;
}

/** Suggest weight for a given 1RM and target reps (inverse Epley) */
export function weightFromRm(oneRmKg: number, targetReps: number): number {
  if (targetReps === 1) return oneRmKg;
  const weight = oneRmKg / (1 + targetReps / 30);
  // Round to nearest 0.25 kg
  return Math.round(weight * 4) / 4;
}
