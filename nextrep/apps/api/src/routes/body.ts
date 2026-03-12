import { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { bodyMeasurements } from '../db/schema';
import { sendSuccess, sendError } from '../utils/errors';

const CreateBodySchema = z.object({
  date:              z.string(),
  weightKg:          z.number().positive().optional(),
  bodyFatPct:        z.number().min(0).max(100).optional(),
  muscleMassKg:      z.number().positive().optional(),
  chestCm:           z.number().positive().optional(),
  waistCm:           z.number().positive().optional(),
  hipsCm:            z.number().positive().optional(),
  leftBicepCm:       z.number().positive().optional(),
  rightBicepCm:      z.number().positive().optional(),
  leftThighCm:       z.number().positive().optional(),
  rightThighCm:      z.number().positive().optional(),
  neckCm:            z.number().positive().optional(),
  shouldersCm:       z.number().positive().optional(),
  notes:             z.string().optional(),
  photoUrl:          z.string().url().optional(),
});

export async function bodyRoutes(app: FastifyInstance) {
  // GET /body-measurements?limit=30
  app.get('/body-measurements', async (req, reply) => {
    const { limit = '30' } = req.query as { limit?: string };
    const rows = await db.query.bodyMeasurements.findMany({
      where: eq(bodyMeasurements.userId, req.userId!),
      orderBy: (m, { desc }) => [desc(m.date)],
      limit: Math.min(parseInt(limit), 200),
    });
    return sendSuccess(reply, rows);
  });

  // POST /body-measurements
  app.post('/body-measurements', async (req, reply) => {
    const body = CreateBodySchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const [row] = await db.insert(bodyMeasurements).values({
      ...body.data,
      userId: req.userId!,
    }).returning();
    return sendSuccess(reply, row, 201);
  });

  // PUT /body-measurements/:id
  app.put('/body-measurements/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = CreateBodySchema.partial().safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const existing = await db.query.bodyMeasurements.findFirst({
      where: and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, req.userId!)),
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Measurement not found');

    const [updated] = await db.update(bodyMeasurements)
      .set(body.data as any)
      .where(eq(bodyMeasurements.id, id))
      .returning();
    return sendSuccess(reply, updated);
  });

  // DELETE /body-measurements/:id
  app.delete('/body-measurements/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await db.query.bodyMeasurements.findFirst({
      where: and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, req.userId!)),
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Measurement not found');

    await db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id));
    return sendSuccess(reply, null, 204);
  });
}
