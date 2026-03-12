import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import { hashPassword, verifyPassword, hashToken, verifyToken } from '../utils/password';
import { signAccessToken, signRefreshToken, refreshTokenExpiresAt, verifyRefreshToken } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '@nextrep/shared';

export async function register(input: RegisterInput) {
  // Check if email is already taken
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { code: 'EMAIL_TAKEN', status: 409 });
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email:        input.email.toLowerCase(),
      passwordHash,
      displayName:  input.displayName ?? null,
    })
    .returning();

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.email);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
  };
}

export async function login(input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
  });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS', status: 401 });
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS', status: 401 });
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.email);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
  };
}

export async function refresh(token: string) {
  // Verify token signature first
  let userId: string;
  try {
    const payload = await verifyRefreshToken(token);
    userId = payload.sub;
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { code: 'INVALID_TOKEN', status: 401 });
  }

  // Find a matching non-revoked, non-expired stored token
  const storedTokens = await db.query.refreshTokens.findMany({
    where: and(
      eq(refreshTokens.userId, userId),
      eq(refreshTokens.revoked, false),
      gt(refreshTokens.expiresAt, new Date()),
    ),
  });

  // Check each stored hash for a match (bcrypt compare)
  let matchedToken: typeof storedTokens[0] | null = null;
  for (const stored of storedTokens) {
    if (await verifyToken(token, stored.tokenHash)) {
      matchedToken = stored;
      break;
    }
  }

  if (!matchedToken) {
    // Possible token reuse — revoke all tokens for this user as a security measure
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
    throw Object.assign(new Error('Refresh token reuse detected'), { code: 'INVALID_TOKEN', status: 401 });
  }

  // Revoke the old token (rotation)
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, matchedToken.id));

  // Find user to get email
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 });

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(user.id, user.email);
  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
  };
}

export async function logout(userId: string) {
  // Revoke all refresh tokens for this user (full logout)
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.userId, userId));
}

async function issueTokenPair(userId: string, email: string) {
  const [accessToken, rawRefreshToken] = await Promise.all([
    signAccessToken(userId, email),
    signRefreshToken(userId),
  ]);

  const tokenHash = await hashToken(rawRefreshToken);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt: refreshTokenExpiresAt(),
  });

  return { accessToken, refreshToken: rawRefreshToken };
}
