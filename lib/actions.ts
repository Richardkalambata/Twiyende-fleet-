'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSession, destroySession, getCurrentUser, requireUser } from './auth';
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
  markNotificationRead,
} from './service';
import type { Fail } from './types';

function refresh() {
  revalidatePath('/', 'layout');
}

export async function loginAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const result = await authenticate(String(formData.get('phone') ?? ''), String(formData.get('pin') ?? ''));
  if (!result.ok) return result;
  const gate = String(formData.get('gate') ?? 'passenger');
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
  await createSession(result.user.id);
  redirect(homeFor(result.user.role));
}

export async function demoLoginAction(formData: FormData) {
  const gate = String(formData.get('gate') ?? 'passenger');
  const back = gate === 'conductor' ? '/business/conductor/login' : gate === 'operator' || gate === 'business' ? '/business/login' : '/login';
  const result = await authenticateDemo(String(formData.get('userId') ?? ''));
  if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.message)}`);
  if (gate === 'passenger' && result.user.role !== 'passenger') {
    redirect(`${back}?error=${encodeURIComponent('Open Twende Fleet Business for this account.')}`);
  }
  if (gate === 'operator' && result.user.role !== 'operator') {
    redirect(`${back}?error=${encodeURIComponent('This sign-in is for operators. Conductors use Conductor sign in.')}`);
  }
  if (gate === 'conductor' && result.user.role !== 'conductor') {
    redirect(`${back}?error=${encodeURIComponent('This sign-in is for conductors. Operators use Operator sign in.')}`);
  }
  await createSession(result.user.id);
  redirect(homeFor(result.user.role));
}

export async function signOutAction() {
  const user = await getCurrentUser();
  if (user?.role === 'conductor') {
    const { endShift } = await import('./tracking');
    await endShift(user.id);
  }
  await destroySession();
  if (user?.role === 'conductor') redirect('/business/conductor/login');
  redirect(user && user.role !== 'passenger' ? '/business' : '/');
}

export async function payAction(fleetNumber: string, fare: string) {
  const user = await requireUser(['passenger']);
  const result = await payFare(user.id, fleetNumber, fare);
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

export async function topUpAction(network: string, phone: string, amount: string) {
  const user = await requireUser(['passenger']);
  const result = await topUp(user.id, network, phone, amount);
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

export async function verifyPickupAction(code: string) {
  const user = await requireUser(['conductor', 'operator']);
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
  const result = await registerBus(user.id, String(formData.get('fleet') ?? ''), String(formData.get('plate') ?? ''), String(formData.get('route') ?? ''));
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

export async function setBusStatusAction(formData: FormData) {
  const user = await requireUser(['operator']);
  const status = String(formData.get('status') ?? '') === 'offline' ? 'offline' : 'active';
  await setBusStatus(user.id, String(formData.get('busId') ?? ''), status);
  refresh();
}

export async function assignConductorAction(formData: FormData) {
  const user = await requireUser(['operator']);
  const conductor = String(formData.get('conductorId') ?? '');
  await assignConductor(user.id, String(formData.get('busId') ?? ''), conductor || null);
  refresh();
}

export async function savePayoutAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['operator']);
  const result = await savePayoutDestination(user.id, String(formData.get('network') ?? ''), String(formData.get('destination') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function payoutAction(_prev: Fail | { ok: true; message: string } | null, formData: FormData) {
  const user = await requireUser(['operator']);
  const result = await requestPayout(user.id, String(formData.get('amount') ?? ''));
  if (result.ok) refresh();
  return result;
}

export async function resetDemoAction() {
  const user = await requireUser(['operator']);
  if (!user.demo) return;
  await restoreDemoData();
  await createSession(user.id);
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
  await createSession(result.id);
  redirect('/home');
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
  await createSession(result.id);
  redirect('/business/desk');
}

export async function assignShiftAction(formData: FormData) {
  const user = await requireUser(['operator']);
  const conductor = String(formData.get('conductorId') ?? '');
  await saveAssignment(user.id, String(formData.get('busId') ?? ''), conductor || null);
  refresh();
}

export async function updateProfileAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser();
  const result = await updateProfile(user.id, String(formData.get('name') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function changePinAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser();
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
  const result = await openSupport(user.id, String(formData.get('subject') ?? ''), String(formData.get('body') ?? ''));
  if (!result.ok) return result;
  refresh();
  return { ok: false, message: 'Sent. We will reply in the app.' };
}

export async function replySupportAction(formData: FormData) {
  const user = await requireUser(['operator']);
  await replySupport(user.id, String(formData.get('ticketId') ?? ''), String(formData.get('body') ?? ''), formData.get('close') === 'on');
  refresh();
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

export async function readNoticeAction(formData: FormData) {
  const user = await requireUser();
  await markNotificationRead(user.id, String(formData.get('id') ?? ''));
  refresh();
}
