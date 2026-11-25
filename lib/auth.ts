import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getDb, withTransaction } from './db';
import { requiresOperatorSms } from './operator-sms-policy';
import { getPublicUser } from './service';
import type { PublicUser, Role } from './types';

const SESSION_COOKIES: Record<Role, string> = {
  passenger: 'twende_rider_session',
  conductor: 'twende_conductor_session',
  operator: 'twende_operator_session',
};
const LOGIN_PATHS: Record<Role, string> = {
  passenger: '/login',
  conductor: '/business/conductor/login',
  operator: '/business/login',
};
const MAX_AGE = 60 * 60 * 24 * 30;

export function isRole(role: unknown): role is Role {
  return role === 'passenger' || role === 'conductor' || role === 'operator';
}

function hashToken(role: Role, token: string) {
  return createHash('sha256').update(role).update(':').update(token).digest('hex');
}

function validToken(token: string | undefined): token is string {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

async function revokeToken(role: Role, token: string | undefined) {
  if (validToken(token)) await (await getDb()).run('DELETE FROM sessions WHERE id = ?', hashToken(role, token));
}

export async function createSession(userId: string, role: Role, operatorVerified = false) {
  const jar = await cookies();
  const key = SESSION_COOKIES[role];
  const token = randomBytes(32).toString('hex');
  await withTransaction(async () => {
    const db = await getDb();
    await db.run('INSERT INTO sessions (id, user_id, expires_at, operator_verified) VALUES (?, ?, ?, ?)',
      hashToken(role, token), userId, Date.now() + MAX_AGE * 1_000, operatorVerified);
    await revokeToken(role, jar.get(key)?.value);
  });
  jar.delete('twende_session');
  jar.set(key, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(role: Role) {
  const jar = await cookies();
  const key = SESSION_COOKIES[role];
  await revokeToken(role, jar.get(key)?.value);
  jar.delete(key);
}

export const getCurrentUser = cache(async (role: Role): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIES[role])?.value;
  if (!validToken(token)) return null;
  const db = await getDb();
  const row = await db.get<{ user_id: string; operator_verified: boolean }>(
    'SELECT user_id, operator_verified FROM sessions WHERE id = ? AND expires_at > ?', hashToken(role, token), Date.now(),
  );
  if (!row) return null;
  const user = await getPublicUser(row.user_id);
  if (user?.role !== role) return null;
  if (role === 'operator' && requiresOperatorSms() && !row.operator_verified && !(user.demo && process.env.DEMO_ROLE_SWITCHER === '1')) return null;
  return user;
});

export async function requireUser(roles: readonly [Role, ...Role[]]): Promise<PublicUser> {
  for (const role of roles) {
    const user = await getCurrentUser(role);
    if (user) return user;
  }
  redirect(LOGIN_PATHS[roles[0]]);
}
