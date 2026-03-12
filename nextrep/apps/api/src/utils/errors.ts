import type { FastifyReply } from 'fastify';

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: unknown,
  code?: string,
) {
  return reply.status(statusCode).send({
    success: false,
    error: message,
    code,
    statusCode,
  });
}

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({ success: true, data });
}

// Standard error codes
export const ErrorCode = {
  UNAUTHORIZED:         'UNAUTHORIZED',
  INVALID_CREDENTIALS:  'INVALID_CREDENTIALS',
  EMAIL_TAKEN:          'EMAIL_TAKEN',
  NOT_FOUND:            'NOT_FOUND',
  FORBIDDEN:            'FORBIDDEN',
  VALIDATION_ERROR:     'VALIDATION_ERROR',
  INTERNAL:             'INTERNAL_SERVER_ERROR',
  RATE_LIMITED:         'RATE_LIMITED',
  TOKEN_EXPIRED:        'TOKEN_EXPIRED',
  INVALID_TOKEN:        'INVALID_TOKEN',
} as const;
