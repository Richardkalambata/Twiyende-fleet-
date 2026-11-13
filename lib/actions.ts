'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSession, destroySession, requireUser } from './auth';
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
  savePayoutDestination,
  sendTip,
  setBusStatus,
  topUp,
  verifyCode,
  verifyPickup,
} from './service';
import type { Fail } from './types';

function refresh() {
  revalidatePath('/', 'layout');
}

export async function loginAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const result = await authenticate(String(formData.get('phone') ?? ''), String(formData.get('pin') ?? ''));
  if (!result.ok) return result;
  await createSession(result.user.id);
  redirect(homeFor(result.user.role));
}

export async function demoLoginAction(formData: FormData) {
  const result = await authenticateDemo(String(formData.get('userId') ?? ''));
  if (!result.ok) redirect(`/login?error=${encodeURIComponent(result.message)}`);
  await createSession(result.user.id);
  redirect(homeFor(result.user.role));
}

export async function signOutAction() {
  await destroySession();
  redirect('/login');
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
  const user = await requireUser(['conductor', 'owner']);
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
  const user = await requireUser(['owner']);
  const result = await registerBus(user.id, String(formData.get('fleet') ?? ''), String(formData.get('plate') ?? ''), String(formData.get('route') ?? ''));
  if (!result.ok) return result;
  refresh();
  redirect('/fleet/buses');
}

export async function registerConductorAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['owner']);
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
  redirect('/fleet/conductors');
}

export async function setBusStatusAction(formData: FormData) {
  const user = await requireUser(['owner']);
  const status = String(formData.get('status') ?? '') === 'offline' ? 'offline' : 'active';
  await setBusStatus(user.id, String(formData.get('busId') ?? ''), status);
  refresh();
}

export async function assignConductorAction(formData: FormData) {
  const user = await requireUser(['owner']);
  const conductor = String(formData.get('conductorId') ?? '');
  await assignConductor(user.id, String(formData.get('busId') ?? ''), conductor || null);
  refresh();
}

export async function savePayoutAction(_prev: Fail | null, formData: FormData): Promise<Fail | null> {
  const user = await requireUser(['owner']);
  const result = await savePayoutDestination(user.id, String(formData.get('network') ?? ''), String(formData.get('destination') ?? ''));
  if (!result.ok) return result;
  refresh();
  return null;
}

export async function payoutAction(_prev: Fail | { ok: true; message: string } | null, formData: FormData) {
  const user = await requireUser(['owner']);
  const result = await requestPayout(user.id, String(formData.get('amount') ?? ''));
  if (result.ok) refresh();
  return result;
}

export async function resetDemoAction() {
  const user = await requireUser(['owner']);
  if (!user.demo) return;
  await restoreDemoData();
  await createSession(user.id);
  redirect('/fleet?reset=1');
}
