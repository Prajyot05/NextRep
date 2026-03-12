import { FastifyInstance } from 'fastify';
import { eq, ilike, and } from 'drizzle-orm';
import { db } from '../db';
import { exercises } from '../db/schema';
import { CreateExerciseSchema } from '@nextrep/shared';
import { sendSuccess, sendError } from '../utils/errors';

export async function exerciseRoutes(app: FastifyInstance) {
  // GET /exercises?muscle=CHEST&q=bench
  app.get('/exercises', async (req, reply) => {
    const { muscle, q, category } = req.query as Record<string, string>;
    const conditions: any[] = [eq(exercises.isCustom, false)];

    if (muscle) conditions.push(eq(exercises.primaryMuscle, muscle as any));
    if (category) conditions.push(eq(exercises.category, category as any));
    if (q) conditions.push(ilike(exercises.name, `%${q}%`));

    const rows = await db.query.exercises.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      orderBy: (e, { asc }) => [asc(e.name)],
    });
    return sendSuccess(reply, rows);
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

  // POST /exercises (custom exercise)
  app.post('/exercises', async (req, reply) => {
    const body = CreateExerciseSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const [exercise] = await db
      .insert(exercises)
      .values({
        ...body.data,
        isCustom: true,
        userId: req.userId!,
      })
      .returning();
    return sendSuccess(reply, exercise, 201);
  });
}
