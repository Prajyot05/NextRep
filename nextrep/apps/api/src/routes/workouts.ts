import { FastifyInstance } from 'fastify';
import { CreateSessionSchema, SyncPayloadSchema } from '@nextrep/shared';
import {
  createSession,
  syncSessions,
  getSessionById,
  listSessions,
  deleteSession,
  getCalendar,
  getSessionSummary,
} from '../services/workoutService';
import { sendSuccess, sendError } from '../utils/errors';

export async function workoutRoutes(app: FastifyInstance) {
  // GET /workouts?page=1&limit=20&muscle=CHEST
  app.get('/workouts', async (req, reply) => {
    const { page = '1', limit = '20', muscle } = req.query as Record<string, string>;
    const result = await listSessions(req.userId!, parseInt(page), Math.min(parseInt(limit), 100));
    return sendSuccess(reply, result);
  });

  // GET /workouts/calendar?year=2024&month=5
  app.get('/workouts/calendar', async (req, reply) => {
    const { year, month } = req.query as Record<string, string>;
    const result = await getCalendar(req.userId!);
    return sendSuccess(reply, result);
  });

  // GET /workouts/:id/summary (lightweight for calendar popup)
  app.get('/workouts/:id/summary', async (req, reply) => {
    const { id } = req.params as { id: string };
    const summary = await getSessionSummary(req.userId!, id);
    if (!summary) return sendError(reply, 404, 'Workout not found', 'NOT_FOUND');
    return sendSuccess(reply, summary);
  });

  // GET /workouts/:id
  app.get('/workouts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = await getSessionById(req.userId!, id);
    if (!session) return sendError(reply, 404, 'Workout not found', 'NOT_FOUND');
    return sendSuccess(reply, session);
  });

  // POST /workouts (create single session)
  app.post('/workouts', async (req, reply) => {
    const body = CreateSessionSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');
    const session = await createSession(req.userId!, body.data);
    return sendSuccess(reply, session, 201);
  });

  // POST /workouts/sync (offline sync)
  app.post('/workouts/sync', async (req, reply) => {
    const body = SyncPayloadSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');
    const result = await syncSessions(req.userId!, body.data.sessions);
    return sendSuccess(reply, result);
  });

  // DELETE /workouts/:id
  app.delete('/workouts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await deleteSession(req.userId!, id);
    return sendSuccess(reply, null, 204);
  });
}
