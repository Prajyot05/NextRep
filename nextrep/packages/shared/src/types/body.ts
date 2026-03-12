export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  leftArmCm: number | null;
  rightArmCm: number | null;
  leftThighCm: number | null;
  rightThighCm: number | null;
  neckCm: number | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateBodyMeasurementInput = Omit<
  BodyMeasurement,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export interface WeightTrendPoint {
  date: string;
  weightKg: number;
  movingAvg7d: number | null;
}
