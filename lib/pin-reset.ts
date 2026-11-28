import { createHash, randomBytes } from 'node:crypto';
import { allowAttempt } from './attempt-limit';
import { getDb, withTransaction } from './db';
import { normalizePhone, phoneToTel } from './phone';
import { hashPin } from './pin';
import { verifyRequest } from './twilio-verify';
import type { Role } from './types';

export const PIN_RESET_TTL = 300;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const activeAccount = `(CASE WHEN role = 'owner' THEN 'operator' ELSE role END) = ?
  AND (conductor_closes_at IS NULL OR conductor_closes_at > ?) AND (NOT demo OR ?)`;
type Account = { id: string; pin_hash: string };
type Challenge = { user_id: string; pin_hash: string; provider_sid: string };

function recoveryService() {
  const { TWILIO_PIN_RESET_SERVICE_SID: service, TWILIO_VERIFY_SERVICE_SID: loginService,
    TWILIO_API_KEY: key, TWILIO_API_SECRET: secret } = process.env;
  return service && /^VA[a-f\d]{32}$/i.test(service) && service !== loginService && key && secret ? service : null;
}

export function pinResetAvailable() {
  return Boolean(recoveryService());
}

export async function requestPinReset(role: Role, phone: string): Promise<string | null> {
  const service = recoveryService();
  if (!service || phone !== normalizePhone(phone)) return null;
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const db = await getDb();
  const account = await db.get<Account>(`SELECT id, pin_hash FROM users WHERE phone = ? AND ${activeAccount}`,
    phone, role, now, process.env.TWENDE_ENV !== 'production');
  if (!account || !await allowAttempt(`pin-reset-send:${account.id}`, 1, 60_000, now)
    || !await allowAttempt(`pin-reset-window:${account.id}`, 5, 3_600_000, now)) return token;
  const result = await verifyRequest(service, 'Verifications', { To: phoneToTel(phone), Channel: 'sms' });
  if (result?.status !== 'pending' || !/^VE[a-f\d]{32}$/i.test(result.sid)) return token;
  await db.run('DELETE FROM pin_resets WHERE expires_at <= ?', Date.now());
  await db.run(`INSERT INTO pin_resets (id, user_id, role, provider_sid, pin_hash, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)`, digest(token), account.id, role, result.sid, account.pin_hash, now + PIN_RESET_TTL * 1000);
  return token;
}

export async function resetPinWithCode(role: Role, token: string, code: string, pin: string): Promise<boolean> {
  const service = recoveryService();
  if (!service || !/^[a-f\d]{64}$/.test(token) || !/^\d{6}$/.test(code) || !/^\d{6}$/.test(pin)) return false;
  const id = digest(token);
  const now = Date.now();
  const challenge = await (await getDb()).get<Challenge>(`UPDATE pin_resets SET attempts = attempts + 1
    WHERE id = ? AND role = ? AND expires_at > ? AND attempts < 5
    RETURNING user_id, pin_hash, provider_sid`, id, role, now);
  if (!challenge || !await allowAttempt(`pin-reset-check:${challenge.user_id}`, 5, 300_000, now)) return false;
  const verified = await verifyRequest(service, 'VerificationCheck', { VerificationSid: challenge.provider_sid, Code: code });
  if (verified?.status !== 'approved' || verified.sid !== challenge.provider_sid) return false;
  const hashedPin = hashPin(pin);
  return withTransaction(async () => {
    const db = await getDb();
    const updated = await db.run(`UPDATE users SET pin_hash = ? WHERE id = ? AND pin_hash = ? AND ${activeAccount}
      AND EXISTS (SELECT 1 FROM pin_resets WHERE id = ? AND expires_at > ?)`,
    hashedPin, challenge.user_id, challenge.pin_hash, role, Date.now(), process.env.TWENDE_ENV !== 'production', id, Date.now());
    if (updated.changes !== 1) return false;
    await db.run('DELETE FROM sessions WHERE user_id = ?', challenge.user_id);
    await db.run('DELETE FROM operator_verifications WHERE user_id = ?', challenge.user_id);
    await db.run('DELETE FROM pin_resets WHERE user_id = ?', challenge.user_id);
    return true;
  });
}
