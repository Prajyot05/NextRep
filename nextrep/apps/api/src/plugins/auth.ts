import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccessToken } from '../utils/jwt';
import { sendError, ErrorCode } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userEmail: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('userId', '');
  fastify.decorateRequest('userEmail', '');

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for public routes
    const publicPaths = [
      '/health',
      '/auth/register',
      '/auth/login',
      '/auth/refresh',
      '/exercises/catalog',
    ];
    if (publicPaths.some((p) => request.url.startsWith(p))) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(reply, 401, 'Missing authorization header', ErrorCode.UNAUTHORIZED);
    }

    const token = authHeader.slice(7);
    try {
      const { sub, email } = await verifyAccessToken(token);
      request.userId    = sub;
      request.userEmail = email;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('expired')) {
        return sendError(reply, 401, 'Access token expired', ErrorCode.TOKEN_EXPIRED);
      }
      return sendError(reply, 401, 'Invalid token', ErrorCode.INVALID_TOKEN);
    }
  });
};

export default fp(authPlugin, { name: 'auth' });
