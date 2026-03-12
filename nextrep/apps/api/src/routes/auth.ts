import { FastifyInstance } from 'fastify';
import { LoginSchema, RegisterSchema, RefreshSchema } from '@nextrep/shared';
import { register, login, refresh, logout } from '../services/authService';
import { sendSuccess, sendError } from '../utils/errors';

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/auth/register', { config: { skipAuth: true } }, async (req, reply) => {
    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');
    const result = await register(body.data);
    return sendSuccess(reply, result, 201);
  });

  // POST /auth/login
  app.post('/auth/login', { config: { skipAuth: true } }, async (req, reply) => {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');
    const result = await login(body.data);
    return sendSuccess(reply, result);
  });

  // POST /auth/refresh
  app.post('/auth/refresh', { config: { skipAuth: true } }, async (req, reply) => {
    const body = RefreshSchema.safeParse(req.body);
    if (!body.success) return sendError(reply, 400, body.error.flatten().fieldErrors, 'VALIDATION_ERROR');
    const result = await refresh(body.data.refreshToken);
    return sendSuccess(reply, result);
  });

  // DELETE /auth/logout
  app.delete('/auth/logout', async (req, reply) => {
    await logout(req.userId!);
    return sendSuccess(reply, null, 204);
  });
}
