export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

export function displayWeight(kg: number, unit: WeightUnit = 'kg'): string {
  if (unit === 'lbs') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToKg(value) : value;
}

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kgToLbs(kg) : kg;
}

/** Round to nearest plate increment */
export function roundToPlate(kg: number, barbellKg = 1.25): number {
  return Math.round(kg / barbellKg) * barbellKg;
}

export function cmToIn(cm: number): number {
  return Math.round(cm * 0.393701 * 10) / 10;
}

export function inToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
