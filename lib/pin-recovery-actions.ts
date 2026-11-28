'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRole } from './auth';
import { riderPaymentPath } from './codes';
import { normalizePhone } from './phone';
import { PIN_RESET_TTL, pinResetAvailable, requestPinReset, resetPinWithCode } from './pin-reset';
import type { Role } from './types';

type RecoveryState = { step: 'request' | 'reset'; message?: string } | null;
const paths: Record<Role, string> = {
  passenger: '/login',
  operator: '/business/login',
  conductor: '/business/conductor/login',
};

export async function recoverPinAction(role: Role, bus: string | undefined, previous: RecoveryState, data: FormData): Promise<RecoveryState> {
  if (!isRole(role) || !pinResetAvailable()) {
    return { step: 'request', message: 'SMS recovery is unavailable right now.' };
  }
  const jar = await cookies();
  const cookie = `twende_pin_reset_${role}`;
  if (previous?.step !== 'reset' || data.get('restart') === '1') {
    const raw = String(data.get('phone') ?? '');
    const phone = raw.length <= 64 && normalizePhone(raw);
    if (!phone) return { step: 'request', message: 'Enter your registered Zambian mobile number.' };
    const token = await requestPinReset(role, phone);
    if (!token) return { step: 'request', message: 'SMS recovery is unavailable right now.' };
    jar.set(cookie, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: PIN_RESET_TTL,
    });
    return { step: 'reset' };
  }
  const token = jar.get(cookie)?.value;
  if (!token) return { step: 'request', message: 'Your verification expired. Request a new code.' };
  const pin = String(data.get('pin') ?? '');
  if (!/^\d{6}$/.test(pin) || pin !== data.get('confirm')) {
    return { step: 'reset', message: 'Enter the same six-digit PIN in both fields.' };
  }
  if (!await resetPinWithCode(role, token, String(data.get('code') ?? ''), pin)) {
    return { step: 'reset', message: 'That code could not be verified. Check it or request a new code.' };
  }
  jar.delete(cookie);
  const fare = role === 'passenger' && riderPaymentPath(bus);
  redirect(`${paths[role]}?pinReset=1${fare ? `&bus=${bus}` : ''}`);
}
