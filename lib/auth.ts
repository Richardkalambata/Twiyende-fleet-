import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getDb } from './db';
import { requiresOperatorSms } from './operator-sms-policy';
import { getPublicUser, homeFor } from './service';
import type { PublicUser, Role } from './types';

const COOKIE = 'twende_session';
const MAX_AGE = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, operatorVerified = false) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + MAX_AGE * 1000;
  const db = await getDb();
  await db.run('INSERT INTO sessions (id, user_id, expires_at, operator_verified) VALUES (?, ?, ?, ?)', hashToken(token), userId, expiresAt, operatorVerified);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.run('DELETE FROM sessions WHERE id = ?', hashToken(token));
  }
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const row = await db.get<{ user_id: string; operator_verified: boolean }>('SELECT user_id, operator_verified FROM sessions WHERE id = ? AND expires_at > ?', hashToken(token), Date.now());
  if (!row) return null;
  const user = await getPublicUser(row.user_id);
  if (requiresOperatorSms() && user?.role === 'operator' && !row.operator_verified && !(user.demo && process.env.DEMO_ROLE_SWITCHER === '1')) return null;
  return user;
});

export async function requireUser(roles?: Role[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const conductorOnly = Boolean(roles?.length === 1 && roles[0] === 'conductor');
    const business = Boolean(roles && roles.length > 0 && roles.every((role) => role !== 'passenger'));
    redirect(conductorOnly ? '/business/conductor/login' : business ? '/business/login' : '/login');
  }
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
