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

export async function createSession(userId: string, role: Role, proof?: { pinHash: string; operatorVerified?: boolean }) {
  const jar = await cookies();
  const key = SESSION_COOKIES[role];
  const token = randomBytes(32).toString('hex');
  const created = await withTransaction(async () => {
    const db = await getDb();
    const account = await db.get<{ pin_hash: string; demo: boolean }>(`
      SELECT pin_hash, demo FROM users
      WHERE id = ? AND (CASE WHEN role = 'owner' THEN 'operator' ELSE role END) = ?
        AND (conductor_closes_at IS NULL OR conductor_closes_at > ?)
      FOR UPDATE`, userId, role, Date.now());
    if (!account || (proof && account.pin_hash !== proof.pinHash)) return false;
    if (account.demo && process.env.TWENDE_ENV === 'production') return false;
    if (role === 'operator' && requiresOperatorSms() && proof?.operatorVerified !== true
      && !(account.demo && process.env.DEMO_ROLE_SWITCHER === '1')) return false;
    await db.run('INSERT INTO sessions (id, user_id, expires_at, operator_verified) VALUES (?, ?, ?, ?)',
      hashToken(role, token), userId, Date.now() + MAX_AGE * 1_000, proof?.operatorVerified === true);
    await revokeToken(role, jar.get(key)?.value);
    return true;
  });
  if (!created) return false;
  jar.delete('twende_session');
  jar.set(key, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return true;
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
