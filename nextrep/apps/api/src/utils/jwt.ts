import * as jose from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

export async function signAccessToken(userId: string, email: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; email: string }> {
  const { payload } = await jose.jwtVerify(token, SECRET, { algorithms: ['HS256'] });
  if (!payload.sub || !payload.email) {
    throw new Error('Invalid token payload');
  }
  return { sub: payload.sub, email: payload.email as string };
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jose.jwtVerify(token, SECRET, { algorithms: ['HS256'] });
  if (!payload.sub || payload['type'] !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return { sub: payload.sub };
}

/** 30 days from now as a Date */
export function refreshTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}
