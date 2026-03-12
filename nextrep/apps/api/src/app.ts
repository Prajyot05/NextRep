import Fastify, { FastifyInstance } from 'fastify';
import corsPlugin      from './plugins/cors';
import rateLimitPlugin from './plugins/rateLimit';
import authPlugin      from './plugins/auth';
import { authRoutes }      from './routes/auth';
import { exerciseRoutes }  from './routes/exercises';
import { templateRoutes }  from './routes/templates';
import { workoutRoutes }   from './routes/workouts';
import { setRoutes }       from './routes/sets';
import { analyticsRoutes } from './routes/analytics';
import { bodyRoutes }      from './routes/body';
import { recordsRoutes }   from './routes/records';
import { streakRoutes }    from './routes/streaks';
import { milestoneRoutes } from './routes/milestones';
import fp                  from 'fastify-plugin';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);

  // ── Health check (no auth) ───────────────────────────────────────────────────
  app.get('/health', { config: { skipAuth: true } }, async (_req, reply) => {
    return reply.status(200).send({ status: 'ok', ts: new Date().toISOString() });
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  await app.register(authRoutes);
  await app.register(exerciseRoutes);
  await app.register(templateRoutes);
  await app.register(workoutRoutes);
  await app.register(setRoutes);
  await app.register(analyticsRoutes);
  await app.register(bodyRoutes);
  await app.register(recordsRoutes);
  await app.register(streakRoutes);
  await app.register(milestoneRoutes);

  // ── 404 handler ──────────────────────────────────────────────────────────────
  app.setNotFoundHandler((_req, reply) => {
    return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Global error handler ─────────────────────────────────────────────────────
  app.setErrorHandler((err: any, _req, reply) => {
    app.log.error(err);
    const statusCode = err.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code:    'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      },
    });
  });

  return app;
}
