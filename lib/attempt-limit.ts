import { getDb } from './db';

/** Count attempts atomically across all app instances. */
export async function allowAttempt(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
  const db = await getDb();
  const allowed = await db.get(`INSERT INTO login_limits (key, attempts, expires_at) VALUES (?, 1, ?)
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN login_limits.expires_at <= ? THEN 1 ELSE login_limits.attempts + 1 END,
      expires_at = CASE WHEN login_limits.expires_at <= ? THEN EXCLUDED.expires_at ELSE login_limits.expires_at END
    WHERE login_limits.expires_at <= ? OR login_limits.attempts < ? RETURNING key`,
  key, now + windowMs, now, now, now, limit);
  return Boolean(allowed);
}
