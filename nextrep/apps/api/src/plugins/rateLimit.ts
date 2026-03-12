import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    // Tighter limit for auth endpoints
    hook: 'preHandler',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      statusCode: 429,
    }),
  });
};

export default fp(rateLimitPlugin, { name: 'rateLimit' });
