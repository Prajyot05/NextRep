import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workoutSets, workoutSessions } from '../db/schema';
import { CreateSetSchema } from '@nextrep/shared';
import { sendSuccess, sendError } from '../utils/errors';

export async function setRoutes(app: FastifyInstance) {
  // POST /workouts/:sessionId/sets
  app.post('/workouts/:sessionId/sets', async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string };

    // Verify session ownership
    const session = await db.query.workoutSessions.findFirst({
      where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, req.userId!)),
    });
    if (!session) return sendError(reply, 404, 'NOT_FOUND', 'Workout session not found');

    const body = CreateSetSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const [set] = await db.insert(workoutSets).values({
      ...body.data,
      completedAt: new Date(body.data.completedAt),
      sessionId,
    }).returning();
    return sendSuccess(reply, set, 201);
  });

  // PUT /workouts/:sessionId/sets/:setId
  app.put('/workouts/:sessionId/sets/:setId', async (req, reply) => {
    const { sessionId, setId } = req.params as { sessionId: string; setId: string };

    const session = await db.query.workoutSessions.findFirst({
      where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, req.userId!)),
    });
    if (!session) return sendError(reply, 404, 'NOT_FOUND', 'Workout session not found');

    const body = CreateSetSchema.partial().safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');

    const [updated] = await db.update(workoutSets)
      .set(body.data as any)
      .where(and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, sessionId)))
      .returning();

    if (!updated) return sendError(reply, 404, 'NOT_FOUND', 'Set not found');
    return sendSuccess(reply, updated);
  });

  // DELETE /workouts/:sessionId/sets/:setId
  app.delete('/workouts/:sessionId/sets/:setId', async (req, reply) => {
    const { sessionId, setId } = req.params as { sessionId: string; setId: string };

    const session = await db.query.workoutSessions.findFirst({
      where: and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, req.userId!)),
    });
    if (!session) return sendError(reply, 404, 'NOT_FOUND', 'Workout session not found');

    const deleted = await db.delete(workoutSets)
      .where(and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, sessionId)))
      .returning();

    if (!deleted.length) return sendError(reply, 404, 'NOT_FOUND', 'Set not found');
    return sendSuccess(reply, null, 204);
  });
}
