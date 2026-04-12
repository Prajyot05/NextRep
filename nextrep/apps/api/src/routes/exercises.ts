import { FastifyInstance } from 'fastify';
import { eq, ilike, and, or, isNull } from 'drizzle-orm';
import { db } from '../db';
import { exercises } from '../db/schema';
import { CreateExerciseSchema } from '@nextrep/shared';
import { sendSuccess, sendError } from '../utils/errors';

// Cache the catalog JSON in memory (fetched once from GitHub)
let catalogCache: any[] | null = null;
let catalogFetchedAt = 0;
const CATALOG_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const CATALOG_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

async function fetchCatalog(): Promise<any[]> {
  const now = Date.now();
  if (catalogCache && now - catalogFetchedAt < CATALOG_CACHE_TTL) {
    return catalogCache;
  }

  try {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    catalogCache = await res.json() as any[];
    catalogFetchedAt = now;
    return catalogCache;
  } catch (err) {
    // If we have stale cache, use it rather than failing
    if (catalogCache) return catalogCache;
    throw err;
  }
}

export async function exerciseRoutes(app: FastifyInstance) {
  // GET /exercises?muscle=CHEST&q=bench
  app.get('/exercises', async (req, reply) => {
    const { muscle, q, category } = req.query as Record<string, string>;
    // Return global exercises OR user's own custom exercises
    const conditions: any[] = [
      or(eq(exercises.isCustom, false), eq(exercises.userId, req.userId!)),
    ];

    if (muscle) conditions.push(eq(exercises.primaryMuscle, muscle as any));
    if (category) conditions.push(eq(exercises.category, category as any));
    if (q) conditions.push(ilike(exercises.name, `%${q}%`));

    const rows = await db.query.exercises.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      orderBy: (e, { asc }) => [asc(e.name)],
    });
    return sendSuccess(reply, rows);
  });

  // GET /exercises/catalog — Serves the free-exercise-db JSON (cached in memory)
  app.get('/exercises/catalog', { config: { skipAuth: true } }, async (_req, reply) => {
    try {
      const catalog = await fetchCatalog();
      return sendSuccess(reply, catalog);
    } catch (err) {
      return sendError(reply, 502, 'CATALOG_FETCH_FAILED', 'Could not fetch exercise catalog');
    }
  });

  // GET /exercises/:id
  app.get('/exercises/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const exercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, id),
    });
    if (!exercise) return sendError(reply, 404, 'NOT_FOUND', 'Exercise not found');
    return sendSuccess(reply, exercise);
  });

  // POST /exercises (custom exercise or auto-create from catalog)
  app.post('/exercises', async (req, reply) => {
    const body = CreateExerciseSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const { catalogId, imageUrl, level, force, mechanic, ...rest } = body.data as any;

    // If catalogId is provided, check if it already exists in DB
    if (catalogId) {
      const existing = await db.query.exercises.findFirst({
        where: eq(exercises.catalogId, catalogId),
      });
      if (existing) {
        // Already exists — just return it
        return sendSuccess(reply, existing);
      }
    }

    const [exercise] = await db
      .insert(exercises)
      .values({
        ...rest,
        catalogId: catalogId ?? null,
        imageUrl: imageUrl ?? null,
        level: level ?? null,
        force: force ?? null,
        mechanic: mechanic ?? null,
        isCustom: !catalogId,
        userId: catalogId ? null : req.userId!,
      })
      .returning();
    return sendSuccess(reply, exercise, 201);
  });
}
