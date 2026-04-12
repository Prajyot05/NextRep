import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';
import type { MuscleGroup, ExerciseCategory } from '@nextrep/shared';

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Shape of a single item from the free-exercise-db JSON */
export interface CatalogExercise {
  id: string;             // e.g. "Barbell_Bench_Press"
  name: string;
  force: string | null;
  level: string;          // beginner | intermediate | expert
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;       // strength | stretching | plyometrics | strongman | cardio
  images: string[];       // relative paths like "Barbell_Bench_Press/0.jpg"
}

const CATALOG_STORAGE_KEY = 'nextrep_exercise_catalog';
const CATALOG_TIMESTAMP_KEY = 'nextrep_exercise_catalog_ts';
const CATALOG_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// ─── Image URL helpers ──────────────────────────────────────────────────────────

export function getCatalogImageUrl(exerciseId: string, index = 0): string {
  return `${IMAGE_BASE_URL}/${exerciseId}/${index}.jpg`;
}

export function getExerciseImageUrl(exercise: { catalogId?: string | null; imageUrl?: string | null }): string | null {
  if (exercise.imageUrl) return exercise.imageUrl;
  if (exercise.catalogId) return getCatalogImageUrl(exercise.catalogId, 0);
  return null;
}

// ─── Muscle mapping ─────────────────────────────────────────────────────────────

/** Map free-exercise-db muscle names to our MuscleGroup enum values */
const MUSCLE_MAP: Record<string, MuscleGroup> = {
  'chest': 'CHEST',
  'middle back': 'BACK',
  'lower back': 'BACK',
  'shoulders': 'SHOULDERS',
  'biceps': 'BICEPS',
  'triceps': 'TRICEPS',
  'quadriceps': 'QUADS',
  'hamstrings': 'HAMSTRINGS',
  'glutes': 'GLUTES',
  'calves': 'CALVES',
  'abdominals': 'ABS',
  'forearms': 'FOREARMS',
  'traps': 'TRAPS',
  'lats': 'LATS',
  'neck': 'TRAPS',
  'adductors': 'QUADS',
  'abductors': 'GLUTES',
};

/** Map free-exercise-db equipment names to our ExerciseCategory enum values */
const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  'barbell': 'BARBELL',
  'dumbbell': 'DUMBBELL',
  'machine': 'MACHINE',
  'cable': 'CABLE',
  'body only': 'BODYWEIGHT',
  'bands': 'BAND',
  'kettlebells': 'KETTLEBELL',
  'e-z curl bar': 'BARBELL',
  'exercise ball': 'OTHER',
  'foam roll': 'OTHER',
  'medicine ball': 'OTHER',
  'other': 'OTHER',
  null: 'OTHER',
};

function mapMuscle(muscle: string): MuscleGroup {
  return MUSCLE_MAP[muscle.toLowerCase()] ?? 'FULL_BODY';
}

function mapCategory(equipment: string | null): ExerciseCategory {
  return CATEGORY_MAP[(equipment ?? 'other').toLowerCase()] ?? 'OTHER';
}

// ─── Catalog fetching & caching ─────────────────────────────────────────────────

let catalogMemoryCache: CatalogExercise[] | null = null;

/** Fetch the catalog. Uses memory cache → AsyncStorage cache → network */
export async function fetchCatalog(forceRefresh = false): Promise<CatalogExercise[]> {
  // 1. Memory cache (instant)
  if (catalogMemoryCache && !forceRefresh) return catalogMemoryCache;

  // 2. AsyncStorage cache (offline support)
  if (!forceRefresh) {
    try {
      const [stored, ts] = await Promise.all([
        AsyncStorage.getItem(CATALOG_STORAGE_KEY),
        AsyncStorage.getItem(CATALOG_TIMESTAMP_KEY),
      ]);
      if (stored && ts) {
        const age = Date.now() - parseInt(ts, 10);
        if (age < CATALOG_CACHE_TTL) {
          catalogMemoryCache = JSON.parse(stored);
          return catalogMemoryCache!;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  // 3. Fetch from backend (which proxies GitHub)
  try {
    const data = await api.exercises.catalog() as CatalogExercise[];
    catalogMemoryCache = data;

    // Persist to AsyncStorage in background
    AsyncStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    AsyncStorage.setItem(CATALOG_TIMESTAMP_KEY, Date.now().toString()).catch(() => {});

    return data;
  } catch (err) {
    // If we have any cached data, use it as fallback
    if (catalogMemoryCache) return catalogMemoryCache;

    try {
      const stored = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
      if (stored) {
        catalogMemoryCache = JSON.parse(stored);
        return catalogMemoryCache!;
      }
    } catch {
      // Ignore
    }

    throw err;
  }
}

// ─── Search & filter ────────────────────────────────────────────────────────────

/** All unique muscle groups present in the catalog */
export function getAvailableMuscleGroups(catalog: CatalogExercise[]): string[] {
  const set = new Set<string>();
  for (const ex of catalog) {
    for (const m of ex.primaryMuscles) {
      set.add(m.toLowerCase());
    }
  }
  return Array.from(set).sort();
}

/** All unique equipment types present in the catalog */
export function getAvailableEquipment(catalog: CatalogExercise[]): string[] {
  const set = new Set<string>();
  for (const ex of catalog) {
    if (ex.equipment) set.add(ex.equipment.toLowerCase());
  }
  return Array.from(set).sort();
}

export interface CatalogFilter {
  query?: string;
  muscle?: string;
  equipment?: string;
  level?: string;
}

/** Filter/search the catalog array */
export function filterCatalog(catalog: CatalogExercise[], filters: CatalogFilter): CatalogExercise[] {
  let results = catalog;

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter((ex) => ex.name.toLowerCase().includes(q));
  }

  if (filters.muscle) {
    const m = filters.muscle.toLowerCase();
    results = results.filter((ex) =>
      ex.primaryMuscles.some((pm) => pm.toLowerCase() === m) ||
      ex.secondaryMuscles.some((sm) => sm.toLowerCase() === m)
    );
  }

  if (filters.equipment) {
    const e = filters.equipment.toLowerCase();
    results = results.filter((ex) => (ex.equipment ?? '').toLowerCase() === e);
  }

  if (filters.level) {
    results = results.filter((ex) => ex.level === filters.level);
  }

  return results;
}

// ─── Catalog → DB exercise auto-creation ────────────────────────────────────────

/**
 * Select a catalog exercise: auto-creates it in the DB if not already present,
 * then returns the DB exercise (with a UUID id for FK integrity).
 */
export async function selectCatalogExercise(catalogExercise: CatalogExercise): Promise<{
  id: string;
  name: string;
  catalogId: string;
  primaryMuscle: MuscleGroup;
  category: ExerciseCategory;
  imageUrl: string;
}> {
  const primaryMuscle = mapMuscle(catalogExercise.primaryMuscles[0] ?? 'chest');
  const secondaryMuscles = catalogExercise.secondaryMuscles
    .map(mapMuscle)
    .filter((m, i, arr) => arr.indexOf(m) === i && m !== primaryMuscle);
  const category = mapCategory(catalogExercise.equipment);
  const imageUrl = getCatalogImageUrl(catalogExercise.id, 0);

  const result = await api.exercises.create({
    name: catalogExercise.name,
    primaryMuscle,
    secondaryMuscles,
    category,
    equipment: catalogExercise.equipment ?? undefined,
    instructions: catalogExercise.instructions?.join('\n\n') ?? undefined,
    catalogId: catalogExercise.id,
    imageUrl,
    level: catalogExercise.level,
    force: catalogExercise.force ?? undefined,
    mechanic: catalogExercise.mechanic ?? undefined,
  });

  return {
    id: result.id,
    name: result.name,
    catalogId: result.catalogId ?? catalogExercise.id,
    primaryMuscle: result.primaryMuscle,
    category: result.category,
    imageUrl: result.imageUrl ?? imageUrl,
  };
}

// ─── Grouped catalog for display ────────────────────────────────────────────────

export interface CatalogGroup {
  title: string;
  data: CatalogExercise[];
}

/** Group catalog exercises by primary muscle for SectionList display */
export function groupByMuscle(catalog: CatalogExercise[]): CatalogGroup[] {
  const groups: Record<string, CatalogExercise[]> = {};

  for (const ex of catalog) {
    const muscle = (ex.primaryMuscles[0] ?? 'other').toLowerCase();
    const label = muscle.charAt(0).toUpperCase() + muscle.slice(1);
    if (!groups[label]) groups[label] = [];
    groups[label].push(ex);
  }

  return Object.entries(groups)
    .map(([title, data]) => ({ title, data: data.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
