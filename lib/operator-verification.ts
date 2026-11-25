import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { allowAttempt } from './attempt-limit';
import { getDb } from './db';
import { phoneToTel } from './phone';

const COOKIE = 'twende_operator_verification';
const MAX_AGE = 300;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

async function verifyRequest(endpoint: string, body: Record<string, string>) {
  const { TWILIO_VERIFY_SERVICE_SID: service, TWILIO_API_KEY: key, TWILIO_API_SECRET: secret } = process.env;
  if (!service || !key || !secret) return null;
  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return response.ok ? await response.json() as { sid: string; status: string } : null;
  } catch {
    return null;
  }
}

export async function beginOperatorVerification(userId: string, phone: string, pinHash: string) {
  const db = await getDb();
  const now = Date.now();
  if (!await allowAttempt(`sms:${userId}`, 1, 60_000, now)) return false;
  await db.run('DELETE FROM operator_verifications WHERE expires_at <= ?', now);
  const verification = await verifyRequest('Verifications', { To: phoneToTel(phone), Channel: 'sms' });
  if (verification?.status !== 'pending' || !verification.sid) return false;
  const token = randomBytes(32).toString('hex');
  await db.run(`INSERT INTO operator_verifications
    (id, user_id, provider_sid, pin_hash, expires_at) VALUES (?, ?, ?, ?, ?)`,
  digest(token), userId, verification.sid, pinHash, Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE,
  });
  return true;
}

export async function completeOperatorVerification(code: string) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token || !/^\d{6}$/.test(code)) return null;
  const db = await getDb();
  const id = digest(token);
  const challenge = await db.get<{ provider_sid: string }>(`UPDATE operator_verifications
    SET attempts = attempts + 1 WHERE id = ? AND expires_at > ? AND attempts < 5 RETURNING provider_sid`, id, Date.now());
  if (!challenge) return null;
  const result = await verifyRequest('VerificationCheck', { VerificationSid: challenge.provider_sid, Code: code });
  if (result?.status !== 'approved') return null;
  const claimed = await db.get<{ user_id: string; pin_hash: string }>(`
    DELETE FROM operator_verifications AS challenge USING users
    WHERE challenge.id = ? AND challenge.expires_at > ?
      AND users.id = challenge.user_id AND users.pin_hash = challenge.pin_hash
      AND users.role IN ('operator', 'owner')
    RETURNING challenge.user_id, challenge.pin_hash`, id, Date.now());
  jar.delete(COOKIE);
  return claimed;
}
