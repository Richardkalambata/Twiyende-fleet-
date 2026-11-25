'use server';

import { riderPaymentPath } from '@/lib/codes';
import { canResetDemoDatabase } from './db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSession, destroySession, getCurrentUser, isRole, requireUser } from './auth';
import {
  assignConductor,
  authenticate,
  authenticateDemo,
  cancelFare,
  homeFor,
  logFoundItem,
  markFound,
  markNotFound,
  payFare,
  registerBus,
  registerConductor,
  reportLost,
  requestPayout,
  restoreDemoData,
  saveAssignment,
  savePayoutDestination,
  sendTip,
  setBusRoute,
  setBusStatus,
  signupOperator,
  signupPassenger,
  topUp,
  verifyCode,
  verifyPickup,
  updateProfile,
  changePin,
  saveCompany,
  openSupport,
  replySupport,
  addRouteFare,
  settleDay,
  recordConductorPayout,
  saveConductorPayoutDestination,
  markNotificationRead,
  terminateConductor,
} from './service';
import { beginOperatorVerification, completeOperatorVerification } from './operator-verification';
import { requiresOperatorSms } from './operator-sms-policy';
import type { Fail, Role } from './types';

function refresh() {
  revalidatePath('/', 'layout');
}

type LoginState = Fail | { ok: true; step: 'sms'; message?: string } | null;

export async function loginAction(previous: LoginState, formData: FormData): Promise<LoginState> {
  if (previous?.ok && previous.step === 'sms') {
    if (!requiresOperatorSms()) return { ok: false, message: 'Restart sign-in to continue with your PIN.' };
    const userId = await completeOperatorVerification(String(formData.get('code') ?? ''));
    if (!userId) return { ok: true, step: 'sms', message: 'That code could not be verified. Try again or restart sign-in.' };
    await createSession(userId, 'operator', true);
    redirect('/business/desk');
  }
  const gate = String(formData.get('gate') ?? 'passenger');
  if (!isRole(gate) && gate !== 'business') return { ok: false, message: 'Open the correct sign-in page.' };
  const pin = String(formData.get('pin') ?? '');
  const result = await authenticate(String(formData.get('phone') ?? ''), pin);
  if (!result.ok) return result;
  if (gate === 'passenger' && result.user.role !== 'passenger') {
    return { ok: false, message: 'Operators and conductors sign in to Twende Fleet Business.' };
  }
  if (gate === 'operator' && result.user.role !== 'operator') {
    return {
      ok: false,
      message: result.user.role === 'conductor'
        ? 'This sign-in is for operators. Conductors use Conductor sign in.'
        : 'Passengers sign in on the Twende rider app.',
    };
  }
  if (gate === 'conductor' && result.user.role !== 'conductor') {
    return {
      ok: false,
      message: result.user.role === 'operator'
        ? 'This sign-in is for conductors. Operators use Operator sign in.'
        : 'Passengers sign in on the Twende rider app.',
    };
  }
  if (gate === 'business' && result.user.role !== 'operator') {
    return { ok: false, message: 'Passengers and conductors use their own sign-in.' };
  }
  if (result.user.role === 'operator' && requiresOperatorSms()) {
    const sent = await beginOperatorVerification(result.user.id, result.user.phone, result.pinHash, null);
    if (!sent) return { ok: false, message: 'We could not send a code. Wait a minute and try again.' };
    return { ok: true, step: 'sms' };
  }
  await createSession(result.user.id, result.user.role);
  redirect((result.user.role === 'passenger' ? riderPaymentPath(formData.get('bus')) : null) ?? homeFor(result.user.role));
}

export async function demoLoginAction(formData: FormData) {
  const gate = String(formData.get('gate') ?? 'passenger');
  const back = gate === 'conductor' ? '/business/conductor/login' : gate === 'operator' || gate === 'business' ? '/business/login' : '/login';
  if (!isRole(gate) && gate !== 'business') redirect('/login');
  const result = await authenticateDemo(String(formData.get('userId') ?? ''));
  if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.message)}`);
  if (gate === 'passenger' && result.user.role !== 'passenger') {
    redirect(`${back}?error=${encodeURIComponent('Open Twende Fleet Business for this account.')}`);
  }
  if ((gate === 'operator' || gate === 'business') && result.user.role !== 'operator') {
    redirect(`${back}?error=${encodeURIComponent('This sign-in is for operators. Conductors use Conductor sign in.')}`);
  }
  if (gate === 'conductor' && result.user.role !== 'conductor') {
    redirect(`${back}?error=${encodeURIComponent('This sign-in is for conductors. Operators use Operator sign in.')}`);
  }
  await createSession(result.user.id, result.user.role);
  redirect((result.user.role === 'passenger' ? riderPaymentPath(formData.get('bus')) : null) ?? homeFor(result.user.role));
}

export async function signOutAction(role: Role) {
  if (!isRole(role)) return;
  const user = await getCurrentUser(role);
  if (user?.role === 'conductor') {
    const { endShift } = await import('./tracking');
    await endShift(user.id);
  }
  await destroySession(role);
  if (role === 'conductor') redirect('/business/conductor/login');
  redirect(role === 'operator' ? '/business' : '/');
}

export async function payAction(fleetNumber: string, fare: string, requestId: string) {
  const user = await requireUser(['passenger']);
  const result = await payFare(user.id, fleetNumber, fare, requestId);
  if (result.ok) refresh();
  return result;
}

export async function cancelFareAction(rideId: string) {
  const user = await requireUser(['passenger']);
  const result = await cancelFare(user.id, rideId);
  if (result.ok) refresh();
  return result;
}

export async function verifyAction(code: string) {
  const user = await requireUser(['conductor']);
  const result = await verifyCode(user.id, code);
  if (result.ok) refresh();
  return result;
}

export async function topUpAction(network: string, phone: string, amount: string, requestId: string) {
  const user = await requireUser(['passenger']);
  const result = await topUp(user.id, network, phone, amount, requestId);
  if (result.ok) refresh();
  return result;
}

export async function reportLostAction(input: {
  rideId: string;
  category: string;
  description: string;
  photo: string | null;
  notifySms: boolean;
}) {
  const user = await requireUser(['passenger']);
  const result = await reportLost(user.id, input.rideId, input.category, input.description, input.photo, input.notifySms);
  if (result.ok) refresh();
  return result;
}

export async function markFoundAction(itemId: string) {
  const user = await requireUser(['conductor']);
  const result = await markFound(user.id, itemId);
  if (result.ok) refresh();
  return result;
}

export async function markNotFoundAction(itemId: string) {
  const user = await requireUser(['conductor']);
  const result = await markNotFound(user.id, itemId);
  if (result.ok) refresh();
  return result;
}

export async function logFoundAction(input: { category: string; description: string; photo: string | null }) {
  const user = await requireUser(['conductor']);
  const result = await logFoundItem(user.id, input.category, input.description, input.photo);
  if (result.ok) refresh();
  return result;
}

export async function logOperatorFoundAction(_previous: unknown, formData: FormData) {
  const user = await requireUser(['operator']);
  const busId = String(formData.get('busId') ?? '');
  if (!busId) return { ok: false as const, message: 'Choose a bus.' };
  const result = await logFoundItem(user.id, String(formData.get('category') ?? ''), String(formData.get('description') ?? ''), null, busId);
  if (result.ok) refresh();
  return result;
}

export async function verifyPickupAction(role: 'conductor' | 'operator', code: string) {
  if (role !== 'conductor' && role !== 'operator') return { ok: false as const, message: 'Sign in to verify a pickup.' };
  const user = await requireUser([role]);
  const result = await verifyPickup(user.id, code);
  if (result.ok) refresh();
  return result;
}

export async function tipAction(itemId: string, amountNgwee: number) {
  const user = await requireUser(['passenger']);
  const result = await sendTip(user.id, itemId, amountNgwee);
  if (result.ok) refresh();
  return result;
}

export async function registerBusAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['operator']);
  const result = await registerBus(user.id, String(formData.get('fleet') ?? ''), String(formData.get('plate') ?? ''), String(formData.get('route') ?? ''), String(formData.get('conductorId') ?? '') || null);
  if (!result.ok) return result;
  refresh();
  redirect('/business/desk/buses');
}

export async function registerConductorAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['operator']);
  const busId = String(formData.get('busId') ?? '');
  const result = await registerConductor(
    user.id,
    String(formData.get('name') ?? ''),
    String(formData.get('phone') ?? ''),
    String(formData.get('pin') ?? ''),
    busId || null,
  );
  if (!result.ok) return result;
  refresh();
  redirect('/business/desk/conductors');
}

export async function setBusRouteAction(_previous: Fail | { ok: true; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  const result = await setBusRoute(user.id, String(formData.get('busId') ?? ''), String(formData.get('route') ?? ''));
  if (!result.ok) return result;
  refresh();
  return { ok: true as const, message: 'Route saved.' };
}

export async function setBusStatusAction(formData: FormData) {
  const user = await requireUser(['operator']);
  const status = String(formData.get('status') ?? '') === 'offline' ? 'offline' : 'active';
  await setBusStatus(user.id, String(formData.get('busId') ?? ''), status);
  refresh();
}

export async function assignConductorAction(_previous: { ok: boolean; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  const conductor = String(formData.get('conductorId') ?? '');
  const result = await assignConductor(user.id, String(formData.get('busId') ?? ''), conductor || null);
  if (!result.ok) return result;
  refresh();
  return { ok: true, message: 'Assignment saved.' };
}

export async function savePayoutAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['operator']);
  const confirmation = await authenticate(user.phone, String(formData.get('pin') ?? ''));
  if (!confirmation.ok) return confirmation;
  if (confirmation.user.id !== user.id) return { ok: false, message: 'Confirm your own PIN.' };
  const result = await savePayoutDestination(user.id, String(formData.get('network') ?? ''), String(formData.get('destination') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function payoutAction(_prev: Fail | { ok: true; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  const confirmation = await authenticate(user.phone, String(formData.get('pin') ?? ''));
  if (!confirmation.ok) return confirmation;
  if (confirmation.user.id !== user.id) return { ok: false, message: 'Confirm your own PIN.' };
  const result = await requestPayout(user.id, String(formData.get('amount') ?? ''));
  if (result.ok) refresh();
  return result;
}

export async function resetDemoAction() {
  const user = await requireUser(['operator']);
  if (!user.demo || !canResetDemoDatabase()) return;
  await restoreDemoData();
  await createSession(user.id, 'operator');
  redirect('/business/desk?reset=1');
}

export async function signupPassengerAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  if (String(formData.get('pin') ?? '') !== String(formData.get('confirm') ?? '')) {
    return { ok: false, message: 'The two PINs do not match.' };
  }
  if (formData.get('terms') !== 'on') return { ok: false, message: 'Agree to the terms to create an account.' };
  const result = await signupPassenger({
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    pin: String(formData.get('pin') ?? ''),
    network: String(formData.get('network') ?? ''),
  });
  if (!result.ok) return result;
  await createSession(result.id, 'passenger');
  redirect(riderPaymentPath(formData.get('bus')) ?? '/home');
}

export async function signupOperatorAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const result = await signupOperator({
    name: String(formData.get('name') ?? ''),
    company: String(formData.get('company') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    pin: String(formData.get('pin') ?? ''),
    network: String(formData.get('network') ?? 'mtn'),
  });
  if (!result.ok) return result;
  redirect('/business/login');
}

export async function assignShiftAction(formData: FormData) {
  const user = await requireUser(['operator']);
  const conductor = String(formData.get('conductorId') ?? '');
  await saveAssignment(user.id, String(formData.get('busId') ?? ''), conductor || null);
  refresh();
}

export async function updateProfileAction(role: Role, _prev: Fail | null, formData: FormData): Promise<Fail | null> {
  if (!isRole(role)) return { ok: false, message: 'Sign in again.' };
  const user = await requireUser([role]);
  const result = await updateProfile(user.id, String(formData.get('name') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function changePinAction(role: Role, _prev: Fail | null, formData: FormData): Promise<Fail | null> {
  if (!isRole(role)) return { ok: false, message: 'Sign in again.' };
  const user = await requireUser([role]);
  const result = await changePin(user.id, String(formData.get('current') ?? ''), String(formData.get('next') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function saveCompanyAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['operator']);
  const result = await saveCompany(user.id, String(formData.get('company') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function supportAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['passenger']);
  const ride = String(formData.get('rideId') ?? '');
  if (!ride) return { ok: false, message: 'Choose the ride this ticket is about.' };
  const result = await openSupport(user.id, String(formData.get('subject') ?? ''), String(formData.get('body') ?? ''), ride);
  if (!result.ok) return result;
  refresh();
  redirect(`/help/support/${result.id}`);
}

export async function replySupportAction(role: 'operator' | 'passenger', _previous: { ok: boolean; message: string } | null, formData: FormData) {
  if (role !== 'operator' && role !== 'passenger') return { ok: false, message: 'Sign in again.' };
  const user = await requireUser([role]);
  const result = await replySupport(user.id, role, String(formData.get('ticketId') ?? ''), String(formData.get('body') ?? ''), formData.get('close') === 'on');
  if (result.ok) refresh();
  return result;
}

export async function updateOperatorLostAction(_previous: { ok: boolean; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  const id = String(formData.get('itemId') ?? '');
  const result = formData.get('outcome') === 'found' ? await markFound(user.id, id, true) : await markNotFound(user.id, id, true);
  if (result.ok) refresh();
  return result;
}

export async function addFareAction(formData: FormData) {
  const user = await requireUser(['operator']);
  await addRouteFare(user.id, String(formData.get('route') ?? ''), String(formData.get('amount') ?? ''));
  refresh();
}

export async function settleAction(formData: FormData) {
  const user = await requireUser(['operator']);
  await settleDay(user.id, String(formData.get('fleet') ?? ''), String(formData.get('amount') ?? ''));
  refresh();
}

export async function terminateConductorAction(_previous: { ok: boolean; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  if (formData.get('confirm') !== 'on') return { ok: false, message: 'Confirm the account closure first.' };
  const result = await terminateConductor(user.id, String(formData.get('conductorId') ?? ''));
  if (result.ok) refresh();
  return result;
}

export async function readNoticeAction(role: Role, formData: FormData) {
  if (!isRole(role)) return;
  const user = await requireUser([role]);
  await markNotificationRead(user.id, String(formData.get('id') ?? ''));
  refresh();
}


export async function recordConductorPayoutAction(_previous: { ok: boolean; message: string } | null, data: FormData) {
  const user = await requireUser(['operator']);
  const result = await recordConductorPayout(user.id, String(data.get('conductor') ?? ''), String(data.get('amount') ?? ''), String(data.get('date') ?? ''), String(data.get('requestId') ?? ''), String(data.get('transferReference') ?? ''));
  if (result.ok) refresh();
  return result;
}


export async function saveConductorWalletAction(_previous: { ok: boolean; message: string } | null, data: FormData) {
  const user = await requireUser(['conductor']);
  const result = await saveConductorPayoutDestination(user.id, String(data.get('network') ?? ''), String(data.get('phone') ?? ''));
  if (result.ok) refresh();
  return result;
}
