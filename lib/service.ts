import { getDb, resetDatabase } from './db';
import { PICKUP_PLACE, TIP_AMOUNTS_NGWEE } from './constants';
import { confusingCodeMessage, normalizeFleetNumber, randomCode } from './codes';
import { isCategory } from './categories';
import { formatBalance, formatCompact, parseFare, parseMoney } from './money';
import { getPaymentProvider, type MobileMoneyNetwork, type PayoutNetwork } from './payments';
import { hashPin, verifyPin } from './pin';
import { formatPhone, normalizePhone } from './phone';
import { getSmsProvider } from './sms';
import { cleanText, nid } from './text';
import {
  DAY_MS,
  addLusakaDays,
  formatHour24,
  formatRideWhen,
  formatPickupUntil,
  lusakaDateKey,
  lusakaParts,
  lusakaToUtc,
  nextPickupDeadline,
  startOfLusakaDay,
  startOfLusakaMonth,
} from './time';
import type {
  BusOption,
  BusPerformance,
  ChartPoint,
  ConductorAlert,
  ConductorItem,
  ConductorOption,
  Dashboard,
  DemoAccount,
  ExportRide,
  Fail,
  LostStatus,
  LostSummary,
  Notice,
  PassengerLostDetail,
  PayoutSummary,
  PublicUser,
  RangeKey,
  Receipt,
  RideCard,
  RideStatus,
  Role,
  WalletActivity,
} from './types';

type UserRow = {
  id: string;
  name: string;
  short_name: string;
  phone: string;
  pin_hash: string;
  role: Role;
  initials: string;
  demo: number;
  payout_phone: string | null;
  payout_network: string | null;
};

type BusRow = {
  id: string;
  fleet_number: string;
  plate: string;
  route: string;
  status: 'active' | 'offline';
  owner_id: string;
  conductor_id: string | null;
};

type RideJoin = {
  id: string;
  passenger_id: string;
  passenger_label: string;
  bus_id: string;
  conductor_id: string | null;
  amount_ngwee: number;
  code: string;
  status: RideStatus;
  created_at: number;
  verified_at: number | null;
  route_snapshot: string;
  fleet_number: string;
};

class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

const loginFailures = new Map<string, { count: number; until: number }>();

function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* already closed */
    }
    throw error;
  }
}

function asFail(error: unknown): Fail {
  if (error instanceof UserError) return { ok: false, message: error.message };
  throw error;
}

function isUnique(error: unknown): boolean {
  return error instanceof Error && error.message.includes('UNIQUE');
}

function mapUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    phone: row.phone,
    role: row.role,
    initials: row.initials,
    demo: row.demo === 1,
    payoutPhone: row.payout_phone,
    payoutNetwork: row.payout_network,
  };
}

function userById(id: string): UserRow | null {
  return (getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined) ?? null;
}

export function getPublicUser(id: string): PublicUser | null {
  const row = userById(id);
  return row ? mapUser(row) : null;
}

export function parseRange(value: string | undefined): RangeKey {
  if (value === 'week' || value === 'month') return value;
  return 'today';
}

function getBalance(userId: string): number {
  const row = getDb().prepare('SELECT balance_ngwee FROM wallets WHERE user_id = ?').get(userId) as
    | { balance_ngwee: number }
    | undefined;
  return row?.balance_ngwee ?? 0;
}

function writeWallet(
  userId: string,
  delta: number,
  type: string,
  note: string,
  extra: { rideId?: string | null; lostId?: string | null; provider?: string | null; providerRef?: string | null } = {},
): number {
  const current = getBalance(userId);
  if (delta < 0 && current < -delta) {
    throw new UserError(`Not enough balance. You have ${formatBalance(current)}.`);
  }
  const next = current + delta;
  const updated = getDb()
    .prepare('UPDATE wallets SET balance_ngwee = ? WHERE user_id = ? AND balance_ngwee = ?')
    .run(next, userId, current);
  if (Number(updated.changes) !== 1) throw new UserError('Could not update the wallet. Try again.');
  getDb()
    .prepare(`INSERT INTO wallet_transactions
      (id, user_id, type, amount_ngwee, balance_after, provider, provider_ref, ride_id, lost_item_id, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      nid('wtx'),
      userId,
      type,
      delta,
      next,
      extra.provider ?? null,
      extra.providerRef ?? null,
      extra.rideId ?? null,
      extra.lostId ?? null,
      note,
      Date.now(),
    );
  return next;
}

function busByFleet(fleet: string): BusRow | null {
  return (getDb().prepare('SELECT * FROM buses WHERE fleet_number = ?').get(fleet) as BusRow | undefined) ?? null;
}

function busById(id: string): BusRow | null {
  return (getDb().prepare('SELECT * FROM buses WHERE id = ?').get(id) as BusRow | undefined) ?? null;
}

function conductorBus(userId: string): BusRow | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM buses WHERE conductor_id = ? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, fleet_number LIMIT 1`)
      .get(userId) as BusRow | undefined) ?? null
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'T';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

function cleanPhoto(data: string | null | undefined): string | null {
  if (!data) return null;
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(data)) {
    throw new UserError('Use a JPG or PNG photo.');
  }
  if (data.length > 900_000) throw new UserError('That photo is too large. Try a smaller one.');
  return data;
}

function rangeWindow(range: RangeKey, now = new Date()) {
  if (range === 'today') {
    const start = startOfLusakaDay(now);
    return { start, end: start + DAY_MS, previousStart: start - DAY_MS, previousEnd: start };
  }
  if (range === 'week') {
    const end = startOfLusakaDay(now) + DAY_MS;
    const start = end - 7 * DAY_MS;
    return { start, end, previousStart: start - 7 * DAY_MS, previousEnd: start };
  }
  const start = startOfLusakaMonth(now);
  const end = startOfLusakaDay(now) + DAY_MS;
  const { year, month } = lusakaParts(now);
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  return { start, end, previousStart: lusakaToUtc(previous.year, previous.month, 1), previousEnd: start };
}

export function homeFor(role: Role): string {
  if (role === 'conductor') return '/conductor';
  if (role === 'owner') return '/fleet';
  return '/home';
}

export function authenticate(phoneRaw: string, pin: string): { ok: true; user: PublicUser } | Fail {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, message: 'Enter a Zambian mobile number, like 0971 000 001.' };
  if (!/^\d{4}$/.test(pin)) return { ok: false, message: 'The PIN is 4 digits.' };
  const now = Date.now();
  const prior = loginFailures.get(phone);
  if (prior && prior.until > now && prior.count >= 5) {
    return { ok: false, message: 'Too many tries. Wait a minute, then try again.' };
  }
  const row = getDb().prepare('SELECT * FROM users WHERE phone = ?').get(phone) as UserRow | undefined;
  if (!row || !verifyPin(pin, row.pin_hash)) {
    const count = prior && prior.until > now ? prior.count + 1 : 1;
    loginFailures.set(phone, { count, until: now + 60_000 });
    return { ok: false, message: 'That phone number and PIN do not match.' };
  }
  loginFailures.delete(phone);
  return { ok: true, user: mapUser(row) };
}

export function authenticateDemo(userId: string): { ok: true; user: PublicUser } | Fail {
  if (process.env.DEMO_ROLE_SWITCHER === '0') {
    return { ok: false, message: 'Demo sign-in is turned off.' };
  }
  const row = getDb().prepare('SELECT * FROM users WHERE id = ? AND demo = 1').get(userId) as UserRow | undefined;
  if (!row) return { ok: false, message: 'That demo account is not available.' };
  return { ok: true, user: mapUser(row) };
}

export function listDemoAccounts(): DemoAccount[] {
  const rows = getDb().prepare(`SELECT * FROM users WHERE demo = 1`).all() as UserRow[];
  const buses = getDb().prepare('SELECT fleet_number, conductor_id FROM buses').all() as Array<{
    fleet_number: string;
    conductor_id: string | null;
  }>;
  return rows
    .map((row) => {
      let detail = 'Demo account';
      if (row.role === 'passenger') detail = `Wallet ${formatBalance(getBalance(row.id))}`;
      if (row.role === 'owner') detail = 'Fleet owner';
      if (row.role === 'conductor') {
        const bus = buses.find((item) => item.conductor_id === row.id);
        detail = bus ? `Bus ${bus.fleet_number}` : 'No bus assigned';
      }
      return {
        id: row.id,
        name: row.name,
        shortName: row.short_name,
        role: row.role,
        phone: row.phone,
        detail,
      };
    })
    .sort((a, b) => {
      const rank = { passenger: 0, conductor: 1, owner: 2 };
      return rank[a.role] - rank[b.role] || a.shortName.localeCompare(b.shortName);
    });
}

function rideCards(passengerId: string, limit: number): RideCard[] {
  const rows = getDb()
    .prepare(`SELECT r.*, b.fleet_number FROM rides r JOIN buses b ON b.id = r.bus_id
      WHERE r.passenger_id = ? ORDER BY r.created_at DESC LIMIT ?`)
    .all(passengerId, limit) as RideJoin[];
  return rows.map((row) => ({
    id: row.id,
    fleetNumber: row.fleet_number,
    route: row.route_snapshot,
    amountNgwee: row.amount_ngwee,
    status: row.status,
    createdAt: row.created_at,
    whenLabel: formatRideWhen(row.created_at),
    code: row.code,
  }));
}

export function getPassengerHome(userId: string) {
  const user = userById(userId);
  if (!user) throw new UserError('Sign in again.');
  return {
    user: mapUser(user),
    balanceNgwee: getBalance(userId),
    rides: rideCards(userId, 4),
    buses: listBusOptions(),
    notices: passengerNotices(userId),
  };
}

export function listPassengerRides(userId: string): RideCard[] {
  return rideCards(userId, 50);
}

export function listBusOptions(): BusOption[] {
  const rows = getDb()
    .prepare(`SELECT fleet_number, route, status FROM buses ORDER BY CAST(fleet_number AS INTEGER)`)
    .all() as Array<{ fleet_number: string; route: string; status: 'active' | 'offline' }>;
  return rows.map((row) => ({ fleetNumber: row.fleet_number, route: row.route, status: row.status }));
}

export function getReceipt(passengerId: string, rideId: string): Receipt | null {
  const row = getDb()
    .prepare(`SELECT r.*, b.fleet_number FROM rides r JOIN buses b ON b.id = r.bus_id WHERE r.id = ? AND r.passenger_id = ?`)
    .get(rideId, passengerId) as RideJoin | undefined;
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    fleetNumber: row.fleet_number,
    route: row.route_snapshot,
    amountNgwee: row.amount_ngwee,
    status: row.status,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
    balanceNgwee: getBalance(passengerId),
  };
}

export function listWalletActivity(userId: string, limit = 8): WalletActivity[] {
  const rows = getDb()
    .prepare(`SELECT id, type, amount_ngwee, balance_after, note, created_at FROM wallet_transactions
      WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit) as Array<{
    id: string;
    type: string;
    amount_ngwee: number;
    balance_after: number;
    note: string;
    created_at: number;
  }>;
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    amountNgwee: row.amount_ngwee,
    balanceAfter: row.balance_after,
    note: row.note ?? '',
    createdAt: row.created_at,
  }));
}

export function payFare(passengerId: string, fleetRaw: string, fareRaw: string) {
  const fleet = normalizeFleetNumber(fleetRaw);
  const amount = parseFare(fareRaw);
  if (!fleet) return { ok: false as const, message: 'Enter the bus number painted on the minibus.' };
  if (amount == null) return { ok: false as const, message: 'Enter a fare from K1 to K100.' };
  const bus = busByFleet(fleet);
  if (!bus) return { ok: false as const, message: `No Twende bus ${fleet}. Check the number on the vehicle.` };
  if (bus.status !== 'active' || !bus.conductor_id) {
    return { ok: false as const, message: `Bus ${fleet} is not taking Twende payments right now.` };
  }
  const balance = getBalance(passengerId);
  if (balance < amount) {
    return {
      ok: false as const,
      message: `Not enough balance. You have ${formatBalance(balance)}. Top up to pay ${formatCompact(amount)}.`,
    };
  }
  const passenger = userById(passengerId);
  if (!passenger) return { ok: false as const, message: 'Sign in again.' };
  try {
    return withTransaction(() => {
      let code = '';
      let rideId = '';
      for (let attempt = 0; attempt < 8; attempt += 1) {
        code = randomCode(4);
        rideId = nid('ride');
        try {
          getDb()
            .prepare(`INSERT INTO rides
              (id, passenger_id, passenger_label, bus_id, conductor_id, amount_ngwee, code, status, created_at, verified_at, route_snapshot)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?)`)
            .run(rideId, passengerId, passenger.short_name, bus.id, bus.conductor_id, amount, code, Date.now(), bus.route);
          break;
        } catch (error) {
          if (!isUnique(error) || attempt === 7) throw error;
        }
      }
      const balanceNgwee = writeWallet(passengerId, -amount, 'fare', `Fare for Bus ${bus.fleet_number}`, { rideId });
      return {
        ok: true as const,
        rideId,
        code,
        amountNgwee: amount,
        balanceNgwee,
        fleetNumber: bus.fleet_number,
        route: bus.route,
      };
    });
  } catch (error) {
    return asFail(error);
  }
}

export function cancelFare(passengerId: string, rideId: string) {
  try {
    return withTransaction(() => {
      const ride = getDb()
        .prepare(`SELECT r.*, b.fleet_number FROM rides r JOIN buses b ON b.id = r.bus_id WHERE r.id = ? AND r.passenger_id = ?`)
        .get(rideId, passengerId) as RideJoin | undefined;
      if (!ride) throw new UserError('That fare could not be found.');
      if (ride.status === 'verified') throw new UserError('The conductor already confirmed this fare.');
      if (ride.status === 'void') throw new UserError('This fare is already cancelled.');
      const updated = getDb()
        .prepare(`UPDATE rides SET status = 'void' WHERE id = ? AND status = 'pending'`)
        .run(rideId);
      if (Number(updated.changes) !== 1) throw new UserError('This fare can no longer be cancelled.');
      const balanceNgwee = writeWallet(passengerId, ride.amount_ngwee, 'refund', `Refund for Bus ${ride.fleet_number}`, {
        rideId,
      });
      return { ok: true as const, balanceNgwee };
    });
  } catch (error) {
    return asFail(error);
  }
}

export function verifyCode(conductorId: string, rawCode: string) {
  const code = rawCode.toUpperCase().replace(/\s+/g, '');
  const confusing = confusingCodeMessage(code);
  if (confusing) return { ok: false as const, message: confusing };
  const bus = conductorBus(conductorId);
  if (!bus || bus.status !== 'active') {
    return { ok: false as const, message: 'You are not assigned to an active bus yet.' };
  }
  try {
    return withTransaction(() => {
      const ride = getDb().prepare('SELECT * FROM rides WHERE code = ?').get(code) as
        | (RideJoin & { fleet_number?: string })
        | undefined;
      if (!ride) throw new UserError('Code not found. Ask the passenger to read it again.');
      const rideBus = busById(ride.bus_id);
      const fleet = rideBus?.fleet_number ?? 'another bus';
      if (ride.status === 'void') throw new UserError('This fare was cancelled and the passenger was refunded.');
      if (ride.bus_id !== bus.id) {
        throw new UserError(`This code is for Bus ${fleet}, not Bus ${bus.fleet_number}.`);
      }
      if (ride.status === 'verified') {
        throw new UserError(`Already used at ${formatHour24(ride.verified_at ?? ride.created_at)}. A code works once.`);
      }
      const verifiedAt = Date.now();
      const updated = getDb()
        .prepare(`UPDATE rides SET status = 'verified', verified_at = ?, conductor_id = ? WHERE id = ? AND status = 'pending'`)
        .run(verifiedAt, conductorId, ride.id);
      if (Number(updated.changes) !== 1) throw new UserError('This code was just used.');
      const stats = conductorToday(conductorId);
      return {
        ok: true as const,
        amountNgwee: ride.amount_ngwee,
        verifiedAt,
        code,
        fleetNumber: bus.fleet_number,
        todayNgwee: stats.amountNgwee,
        todayRides: stats.rides,
      };
    });
  } catch (error) {
    return asFail(error);
  }
}

function conductorToday(conductorId: string, now = new Date()) {
  const start = startOfLusakaDay(now);
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS rides, COALESCE(SUM(amount_ngwee), 0) AS amount
      FROM rides WHERE conductor_id = ? AND status = 'verified' AND created_at >= ? AND created_at < ?`)
    .get(conductorId, start, start + DAY_MS) as { rides: number; amount: number };
  return { rides: row.rides, amountNgwee: row.amount };
}

export function getConductorHome(userId: string) {
  const user = userById(userId);
  if (!user) throw new UserError('Sign in again.');
  const bus = conductorBus(userId);
  const stats = conductorToday(userId);
  return { user: mapUser(user), bus, todayRides: stats.rides, todayNgwee: stats.amountNgwee };
}

export function listConductorTrips(userId: string) {
  const bus = conductorBus(userId);
  const start = startOfLusakaDay();
  const rows = getDb()
    .prepare(`SELECT passenger_label, code, amount_ngwee, created_at, verified_at FROM rides
      WHERE conductor_id = ? AND status = 'verified' AND created_at >= ?
      ORDER BY verified_at DESC LIMIT 80`)
    .all(userId, start) as Array<{
    passenger_label: string;
    code: string;
    amount_ngwee: number;
    created_at: number;
    verified_at: number | null;
  }>;
  const stats = conductorToday(userId);
  return {
    bus,
    todayRides: stats.rides,
    todayNgwee: stats.amountNgwee,
    trips: rows.map((row) => ({
      passenger: row.passenger_label,
      code: row.code,
      amountNgwee: row.amount_ngwee,
      whenLabel: formatRideWhen(row.verified_at ?? row.created_at),
      timeLabel: formatHour24(row.verified_at ?? row.created_at),
    })),
  };
}

export async function topUp(passengerId: string, network: string, phoneRaw: string, amountRaw: string) {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false as const, message: 'Enter the mobile-money number to charge.' };
  if (network !== 'mtn' && network !== 'airtel' && network !== 'zamtel') {
    return { ok: false as const, message: 'Choose MTN MoMo, Airtel Money, or Zamtel.' };
  }
  const amount = parseMoney(amountRaw, 50_000);
  if (amount == null) return { ok: false as const, message: 'Enter a top-up from K1 to K500.' };
  const reference = nid('top');
  const result = await getPaymentProvider().topUp({
    network: network as MobileMoneyNetwork,
    phone,
    amountNgwee: amount,
    reference,
    passengerId,
  });
  if (!result.ok) return { ok: false as const, message: result.message };
  try {
    const balanceNgwee = withTransaction(() =>
      writeWallet(passengerId, amount, 'topup', `Top up from ${networkLabel(network)}`, {
        provider: network,
        providerRef: result.providerRef,
      }),
    );
    return { ok: true as const, balanceNgwee, providerRef: result.providerRef };
  } catch (error) {
    return asFail(error);
  }
}

function networkLabel(network: string): string {
  if (network === 'mtn') return 'MTN MoMo';
  if (network === 'airtel') return 'Airtel Money';
  if (network === 'zamtel') return 'Zamtel Kwacha';
  if (network === 'bank') return 'bank';
  return network;
}

export function networkDisplay(network: string): string {
  return networkLabel(network);
}

function issuePickup(itemId: string, foundBy: string) {
  const item = getDb().prepare('SELECT * FROM lost_items WHERE id = ?').get(itemId) as
    | { id: string; bus_id: string; passenger_id: string | null; notify_sms: number; category: string; status: string }
    | undefined;
  if (!item) throw new UserError('That report is no longer here.');
  const bus = busById(item.bus_id);
  if (!bus) throw new UserError('That bus is no longer registered.');
  let code = '';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    code = randomCode(4);
    try {
      const updated = getDb()
        .prepare(`UPDATE lost_items
          SET status = 'pickup_pending', pickup_code = ?, pickup_place = ?, pickup_until = ?, found_by = ?, found_at = ?, conductor_id = ?
          WHERE id = ? AND status IN ('reported', 'waiting')`)
        .run(code, PICKUP_PLACE, nextPickupDeadline(), foundBy, Date.now(), foundBy, itemId);
      if (Number(updated.changes) !== 1) throw new UserError('That report was already updated.');
      return { code, bus, notify: item.notify_sms === 1, passengerId: item.passenger_id, category: item.category };
    } catch (error) {
      if (error instanceof UserError) throw error;
      if (!isUnique(error) || attempt === 7) throw error;
    }
  }
  throw new UserError('Could not create a pickup code. Try again.');
}

async function notifyPickup(info: { code: string; bus: BusRow; notify: boolean; passengerId: string | null; category: string; itemId: string }) {
  if (!info.notify || !info.passengerId) return false;
  const passenger = userById(info.passengerId);
  if (!passenger) return false;
  const body = `Twende: your ${info.category} was found on Bus ${info.bus.fleet_number}. Pickup code ${info.code} at ${PICKUP_PLACE}.`;
  try {
    const result = await getSmsProvider().send({ to: passenger.phone, body });
    getDb()
      .prepare(`INSERT INTO sms_messages (id, to_phone, body, status, lost_item_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(nid('sms'), passenger.phone, body, result.status, info.itemId, Date.now());
    return true;
  } catch {
    return false;
  }
}

export async function reportLost(
  passengerId: string,
  rideId: string,
  category: string,
  descriptionRaw: string,
  photo: string | null,
  notifySms: boolean,
) {
  const description = cleanText(descriptionRaw, 280);
  if (!isCategory(category)) return { ok: false as const, message: 'Choose what you lost.' };
  if (description.length < 3) return { ok: false as const, message: 'Add a short description so the conductor can recognise it.' };
  try {
    const pendingSms = withTransaction(() => {
      const ride = getDb()
        .prepare(`SELECT r.*, b.fleet_number, b.owner_id, b.conductor_id FROM rides r JOIN buses b ON b.id = r.bus_id
          WHERE r.id = ? AND r.passenger_id = ?`)
        .get(rideId, passengerId) as (RideJoin & { owner_id: string }) | undefined;
      if (!ride) throw new UserError('Choose one of your trips.');
      if (ride.status !== 'verified') throw new UserError('You can report a lost item after the conductor has confirmed the fare.');
      const photoData = cleanPhoto(photo);
      const waiting = getDb()
        .prepare(`SELECT id FROM lost_items WHERE bus_id = ? AND status = 'waiting' AND category = ? ORDER BY created_at LIMIT 1`)
        .get(ride.bus_id, category) as { id: string } | undefined;
      if (waiting) {
        getDb()
          .prepare(`UPDATE lost_items
            SET ride_id = ?, passenger_id = ?, description = ?, photo_data = COALESCE(?, photo_data), notify_sms = ?, owner_id = ?
            WHERE id = ?`)
          .run(ride.id, passengerId, description, photoData, notifySms ? 1 : 0, ride.owner_id, waiting.id);
        const issued = issuePickup(waiting.id, ride.conductor_id ?? userById(ride.owner_id)?.id ?? passengerId);
        return { itemId: waiting.id, matched: true, issued: { ...issued, itemId: waiting.id } };
      }
      const itemId = nid('lost');
      getDb()
        .prepare(`INSERT INTO lost_items (
          id, ride_id, passenger_id, bus_id, conductor_id, owner_id, category, description, photo_data,
          notify_sms, status, pickup_code, pickup_place, pickup_until, source, found_by, found_at, closed_at, created_at, tip_ngwee
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', NULL, NULL, NULL, 'passenger', NULL, NULL, NULL, ?, 0)`)
        .run(
          itemId,
          ride.id,
          passengerId,
          ride.bus_id,
          ride.conductor_id,
          ride.owner_id,
          category,
          description,
          photoData,
          notifySms ? 1 : 0,
          Date.now(),
        );
      return { itemId, matched: false, issued: null };
    });
    if (pendingSms.issued) await notifyPickup(pendingSms.issued);
    return { ok: true as const, itemId: pendingSms.itemId, matched: pendingSms.matched };
  } catch (error) {
    return asFail(error);
  }
}

export async function markFound(conductorId: string, itemId: string) {
  const bus = conductorBus(conductorId);
  if (!bus) return { ok: false as const, message: 'You are not assigned to a bus.' };
  try {
    const issued = withTransaction(() => {
      const item = getDb().prepare('SELECT id, bus_id, status FROM lost_items WHERE id = ?').get(itemId) as
        | { id: string; bus_id: string; status: string }
        | undefined;
      if (!item || item.bus_id !== bus.id) throw new UserError('That report is not for your bus.');
      if (item.status !== 'reported') throw new UserError('That report is no longer waiting.');
      return issuePickup(item.id, conductorId);
    });
    await notifyPickup({ ...issued, itemId });
    return { ok: true as const, message: 'Marked found. The passenger now has a pickup code.' };
  } catch (error) {
    return asFail(error);
  }
}

export function markNotFound(conductorId: string, itemId: string) {
  const bus = conductorBus(conductorId);
  if (!bus) return { ok: false as const, message: 'You are not assigned to a bus.' };
  try {
    withTransaction(() => {
      const updated = getDb()
        .prepare(`UPDATE lost_items SET status = 'not_found' WHERE id = ? AND bus_id = ? AND status = 'reported'`)
        .run(itemId, bus.id);
      if (Number(updated.changes) !== 1) throw new UserError('That report is no longer open.');
    });
    return { ok: true as const, message: 'Marked as not found. The passenger can see that.' };
  } catch (error) {
    return asFail(error);
  }
}

export async function logFoundItem(conductorId: string, category: string, descriptionRaw: string, photo: string | null) {
  const bus = conductorBus(conductorId);
  if (!bus) return { ok: false as const, message: 'You are not assigned to a bus.' };
  if (!isCategory(category)) return { ok: false as const, message: 'Choose a category.' };
  const description = cleanText(descriptionRaw, 280);
  try {
    const outcome = withTransaction(() => {
      const photoData = cleanPhoto(photo);
      const reported = getDb()
        .prepare(`SELECT id FROM lost_items WHERE bus_id = ? AND status = 'reported' AND category = ? ORDER BY created_at LIMIT 1`)
        .get(bus.id, category) as { id: string } | undefined;
      if (reported) {
        if (photoData) {
          getDb().prepare('UPDATE lost_items SET photo_data = COALESCE(photo_data, ?) WHERE id = ?').run(photoData, reported.id);
        }
        const issued = issuePickup(reported.id, conductorId);
        return { matched: true, itemId: reported.id, issued };
      }
      const itemId = nid('lost');
      const ownerId = bus.owner_id;
      getDb()
        .prepare(`INSERT INTO lost_items (
          id, ride_id, passenger_id, bus_id, conductor_id, owner_id, category, description, photo_data,
          notify_sms, status, pickup_code, pickup_place, pickup_until, source, found_by, found_at, closed_at, created_at, tip_ngwee
        ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, 0, 'waiting', NULL, NULL, NULL, 'conductor', ?, ?, NULL, ?, 0)`)
        .run(itemId, bus.id, conductorId, ownerId, category, description || categoryLabelSafe(category), photoData, conductorId, Date.now(), Date.now());
      return { matched: false, itemId, issued: null };
    });
    if (outcome.issued) await notifyPickup({ ...outcome.issued, itemId: outcome.itemId });
    return {
      ok: true as const,
      matched: outcome.matched,
      message: outcome.matched
        ? 'Matched to a passenger report. They have a pickup code.'
        : 'Saved on this bus. It will match if a passenger reports the same kind of item.',
    };
  } catch (error) {
    return asFail(error);
  }
}

function categoryLabelSafe(category: string): string {
  return category.slice(0, 1).toUpperCase() + category.slice(1);
}

export function verifyPickup(actorId: string, rawCode: string) {
  const code = rawCode.toUpperCase().replace(/\s+/g, '');
  const confusing = confusingCodeMessage(code);
  if (confusing) return { ok: false as const, message: confusing };
  const actor = userById(actorId);
  if (!actor || (actor.role !== 'conductor' && actor.role !== 'owner')) {
    return { ok: false as const, message: 'Only the conductor or owner can close a pickup.' };
  }
  try {
    return withTransaction(() => {
      const item = getDb().prepare('SELECT * FROM lost_items WHERE pickup_code = ?').get(code) as
        | { id: string; bus_id: string; status: LostStatus; category: string }
        | undefined;
      if (!item) throw new UserError('Pickup code not found. Ask the passenger to read it again.');
      const bus = busById(item.bus_id);
      if (!bus) throw new UserError('That bus is no longer registered.');
      if (actor.role === 'conductor') {
        const mine = conductorBus(actorId);
        if (!mine || mine.id !== bus.id) {
          throw new UserError(`This pickup is for Bus ${bus.fleet_number}, not your bus.`);
        }
      } else if (bus.owner_id !== actorId) {
        throw new UserError('That pickup is for another fleet.');
      }
      if (item.status === 'closed') throw new UserError('This item was already handed over.');
      if (item.status !== 'pickup_pending') throw new UserError('This pickup is not ready yet.');
      const updated = getDb()
        .prepare(`UPDATE lost_items SET status = 'closed', closed_at = ? WHERE id = ? AND status = 'pickup_pending'`)
        .run(Date.now(), item.id);
      if (Number(updated.changes) !== 1) throw new UserError('This pickup was just closed.');
      return { ok: true as const, message: `${categoryLabelSafe(item.category)} handed over. The report is closed.` };
    });
  } catch (error) {
    return asFail(error);
  }
}

export function sendTip(passengerId: string, itemId: string, amountRaw: number) {
  if (!TIP_AMOUNTS_NGWEE.includes(amountRaw as (typeof TIP_AMOUNTS_NGWEE)[number])) {
    return { ok: false as const, message: 'Choose K5, K10, or K20.' };
  }
  try {
    return withTransaction(() => {
      const item = getDb().prepare('SELECT * FROM lost_items WHERE id = ? AND passenger_id = ?').get(itemId, passengerId) as
        | { id: string; status: LostStatus; tip_ngwee: number; found_by: string | null; conductor_id: string | null; category: string }
        | undefined;
      if (!item) throw new UserError('That item is not on your account.');
      if (item.status !== 'pickup_pending' && item.status !== 'closed') {
        throw new UserError('You can thank the conductor once the item is found.');
      }
      if (item.tip_ngwee > 0) throw new UserError('You already sent thanks for this item.');
      const conductorId = item.found_by ?? item.conductor_id;
      if (!conductorId) throw new UserError('No conductor is attached to this item yet.');
      const balanceNgwee = writeWallet(passengerId, -amountRaw, 'tip', `Tip for finding your ${item.category}`, { lostId: item.id });
      writeWallet(conductorId, amountRaw, 'tip', `Tip from a passenger`, { lostId: item.id });
      const updated = getDb()
        .prepare('UPDATE lost_items SET tip_ngwee = ? WHERE id = ? AND tip_ngwee = 0')
        .run(amountRaw, item.id);
      if (Number(updated.changes) !== 1) throw new UserError('You already sent thanks for this item.');
      return { ok: true as const, balanceNgwee, message: `Sent ${formatCompact(amountRaw)} to the conductor.` };
    });
  } catch (error) {
    return asFail(error);
  }
}

function passengerNotices(userId: string): Notice[] {
  const rows = getDb()
    .prepare(`SELECT li.id, li.category, li.status, b.fleet_number FROM lost_items li
      JOIN buses b ON b.id = li.bus_id
      WHERE li.passenger_id = ? AND li.status IN ('reported', 'pickup_pending', 'not_found')
      ORDER BY li.created_at DESC LIMIT 6`)
    .all(userId) as Array<{ id: string; category: string; status: LostStatus; fleet_number: string }>;
  return rows.map((row) => {
    if (row.status === 'pickup_pending') {
      return { id: row.id, href: `/lost/${row.id}`, title: `Your ${row.category} was found`, body: `Bus ${row.fleet_number} · open for the pickup code` };
    }
    if (row.status === 'not_found') {
      return { id: row.id, href: `/lost`, title: `${categoryLabelSafe(row.category)} not found yet`, body: `Bus ${row.fleet_number} is still looking` };
    }
    return { id: row.id, href: `/lost`, title: `Conductor alerted`, body: `Your ${row.category} report is with Bus ${row.fleet_number}` };
  });
}

export function listPassengerLost(userId: string): LostSummary[] {
  const rows = getDb()
    .prepare(`SELECT li.*, b.fleet_number, b.route FROM lost_items li JOIN buses b ON b.id = li.bus_id
      WHERE li.passenger_id = ? ORDER BY li.created_at DESC LIMIT 30`)
    .all(userId) as Array<{
    id: string;
    category: string;
    description: string;
    status: LostStatus;
    fleet_number: string;
    route: string;
    created_at: number;
  }>;
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    fleetNumber: row.fleet_number,
    route: row.route,
    createdAt: row.created_at,
    whenLabel: formatRideWhen(row.created_at),
  }));
}

export function getPassengerLostItem(userId: string, itemId: string): PassengerLostDetail | null {
  const row = getDb()
    .prepare(`SELECT li.*, b.fleet_number, b.route, u.short_name AS conductor_name, u.phone AS conductor_phone
      FROM lost_items li
      JOIN buses b ON b.id = li.bus_id
      LEFT JOIN users u ON u.id = COALESCE(li.found_by, li.conductor_id)
      WHERE li.id = ? AND li.passenger_id = ?`)
    .get(itemId, userId) as
    | {
        id: string;
        category: string;
        description: string;
        status: LostStatus;
        fleet_number: string;
        route: string;
        conductor_name: string | null;
        conductor_phone: string | null;
        pickup_code: string | null;
        pickup_place: string | null;
        pickup_until: number | null;
        photo_data: string | null;
        tip_ngwee: number;
      }
    | undefined;
  if (!row) return null;
  const sms = getDb().prepare('SELECT id FROM sms_messages WHERE lost_item_id = ? LIMIT 1').get(itemId) as { id: string } | undefined;
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    fleetNumber: row.fleet_number,
    route: row.route,
    conductorName: row.conductor_name,
    conductorPhone: row.conductor_phone,
    pickupCode: row.pickup_code,
    pickupPlace: row.pickup_place,
    pickupUntil: row.pickup_until,
    pickupUntilLabel: row.pickup_until ? formatPickupUntil(row.pickup_until) : null,
    photoData: row.photo_data,
    tipNgwee: row.tip_ngwee,
    balanceNgwee: getBalance(userId),
    smsSent: Boolean(sms),
  };
}

export function listReportableTrips(userId: string): RideCard[] {
  const rows = getDb()
    .prepare(`SELECT r.*, b.fleet_number FROM rides r JOIN buses b ON b.id = r.bus_id
      WHERE r.passenger_id = ? AND r.status = 'verified' ORDER BY r.created_at DESC LIMIT 20`)
    .all(userId) as RideJoin[];
  return rows.map((row) => ({
    id: row.id,
    fleetNumber: row.fleet_number,
    route: row.route_snapshot,
    amountNgwee: row.amount_ngwee,
    status: row.status,
    createdAt: row.created_at,
    whenLabel: formatRideWhen(row.created_at),
    code: row.code,
  }));
}

export function getConductorLost(userId: string) {
  const bus = conductorBus(userId);
  if (!bus) return { bus: null, alerts: [] as ConductorAlert[], items: [] as ConductorItem[] };
  const alerts = getDb()
    .prepare(`SELECT li.id, li.category, li.description, li.created_at, r.created_at AS ride_at
      FROM lost_items li LEFT JOIN rides r ON r.id = li.ride_id
      WHERE li.bus_id = ? AND li.status = 'reported' ORDER BY li.created_at DESC`)
    .all(bus.id) as Array<{ id: string; category: string; description: string; created_at: number; ride_at: number | null }>;
  const items = getDb()
    .prepare(`SELECT id, category, description, status, created_at, found_at FROM lost_items
      WHERE bus_id = ? AND status IN ('waiting', 'pickup_pending', 'closed')
      ORDER BY CASE status WHEN 'pickup_pending' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END, created_at DESC LIMIT 20`)
    .all(bus.id) as Array<{ id: string; category: string; description: string; status: LostStatus; created_at: number; found_at: number | null }>;
  return {
    bus,
    alerts: alerts.map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      tripLabel: formatHour24(row.ride_at ?? row.created_at),
    })),
    items: items.map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      status: row.status,
      meta:
        row.status === 'waiting'
          ? `found ${formatHour24(row.found_at ?? row.created_at)}`
          : row.status === 'pickup_pending'
            ? 'matched'
            : 'picked up',
    })),
  };
}

type Agg = { created_at: number; amount_ngwee: number; bus_id: string; conductor_id: string | null; fleet_number: string };

export function getOwnerDashboard(ownerId: string, range: RangeKey, routeFleet?: string): Dashboard {
  const now = new Date();
  const window = rangeWindow(range, now);
  const rows = getDb()
    .prepare(`SELECT r.created_at, r.amount_ngwee, r.bus_id, r.conductor_id, b.fleet_number
      FROM rides r JOIN buses b ON b.id = r.bus_id
      WHERE b.owner_id = ? AND r.status = 'verified' AND r.created_at >= ? AND r.created_at < ?`)
    .all(ownerId, Math.min(window.previousStart, window.start), window.end) as Agg[];
  const inSpan = (row: Agg, start: number, end: number) => row.created_at >= start && row.created_at < end;
  const current = rows.filter((row) => inSpan(row, window.start, window.end));
  const previous = rows.filter((row) => inSpan(row, window.previousStart, window.previousEnd));
  const sum = (list: Agg[]) => list.reduce((total, row) => total + row.amount_ngwee, 0);

  const buses = getDb()
    .prepare(`SELECT b.*, u.short_name AS conductor_name, u.initials AS conductor_initials
      FROM buses b LEFT JOIN users u ON u.id = b.conductor_id
      WHERE b.owner_id = ? ORDER BY CAST(b.fleet_number AS INTEGER)`)
    .all(ownerId) as Array<BusRow & { conductor_name: string | null; conductor_initials: string | null }>;

  const performance: BusPerformance[] = buses.map((bus) => {
    const mine = current.filter((row) => row.bus_id === bus.id);
    return {
      id: bus.id,
      fleetNumber: bus.fleet_number,
      plate: bus.plate,
      route: bus.route,
      status: bus.status,
      conductorId: bus.conductor_id,
      conductorName: bus.conductor_name,
      conductorInitials: bus.conductor_initials,
      rides: mine.length,
      earningsNgwee: sum(mine),
    };
  });

  const byConductor = new Map<string, { rides: number; earningsNgwee: number }>();
  for (const row of current) {
    if (!row.conductor_id) continue;
    const bag = byConductor.get(row.conductor_id) ?? { rides: 0, earningsNgwee: 0 };
    bag.rides += 1;
    bag.earningsNgwee += row.amount_ngwee;
    byConductor.set(row.conductor_id, bag);
  }
  const conductorRows = getDb().prepare(`SELECT id, short_name, initials FROM users WHERE role = 'conductor'`).all() as Array<{
    id: string;
    short_name: string;
    initials: string;
  }>;
  let top: Dashboard['topConductor'] = null;
  for (const person of conductorRows) {
    const stats = byConductor.get(person.id);
    if (!stats) continue;
    if (!top || stats.earningsNgwee > top.earningsNgwee || (stats.earningsNgwee === top.earningsNgwee && stats.rides > top.rides)) {
      top = { name: person.short_name, initials: person.initials, earningsNgwee: stats.earningsNgwee, rides: stats.rides };
    }
  }

  const chartRows = routeFleet && routeFleet !== 'all' ? current.filter((row) => row.fleet_number === routeFleet) : current;
  const open = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM lost_items li JOIN buses b ON b.id = li.bus_id WHERE b.owner_id = ? AND li.status = 'reported'`)
    .get(ownerId) as { n: number };
  const todayWindow = rangeWindow('today', now);
  const todayRows = rows.filter((row) => inSpan(row, todayWindow.start, todayWindow.end));
  const paidToday = getDb()
    .prepare(`SELECT COALESCE(SUM(amount_ngwee), 0) AS amount FROM payouts WHERE owner_id = ? AND status = 'paid' AND created_at >= ? AND created_at < ?`)
    .get(ownerId, todayWindow.start, todayWindow.end) as { amount: number };

  return {
    range,
    totalNgwee: sum(current),
    previousNgwee: sum(previous),
    rides: current.length,
    previousRides: previous.length,
    activeBuses: buses.filter((bus) => bus.status === 'active').length,
    totalBuses: buses.length,
    nextPayoutNgwee: Math.max(0, sum(todayRows) - paidToday.amount),
    chart: buildChart(range, chartRows, now),
    buses: performance,
    topConductor: top,
    openLost: open.n,
    routes: buses.map((bus) => ({ fleetNumber: bus.fleet_number, route: bus.route })),
  };
}

function buildChart(range: RangeKey, rows: Agg[], now: Date): ChartPoint[] {
  if (range === 'today') {
    return Array.from({ length: 16 }, (_, index) => {
      const hour = index + 6;
      const value = rows
        .filter((row) => lusakaParts(new Date(row.created_at)).hour === hour)
        .reduce((total, row) => total + row.amount_ngwee, 0);
      return { label: `${String(hour).padStart(2, '0')}:00`, value };
    });
  }
  if (range === 'week') {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addLusakaDays(now, index - 6);
      const start = startOfLusakaDay(day);
      const value = rows.filter((row) => row.created_at >= start && row.created_at < start + DAY_MS).reduce((total, row) => total + row.amount_ngwee, 0);
      const parts = lusakaParts(day);
      return { label: `${parts.weekday} ${parts.day}`, value };
    });
  }
  const { year, month, day } = lusakaParts(now);
  return Array.from({ length: day }, (_, index) => {
    const date = index + 1;
    const start = lusakaToUtc(year, month, date, 0, 0);
    const value = rows.filter((row) => row.created_at >= start && row.created_at < start + DAY_MS).reduce((total, row) => total + row.amount_ngwee, 0);
    return { label: String(date), value };
  });
}

export function listOwnerBuses(ownerId: string): BusPerformance[] {
  return getOwnerDashboard(ownerId, 'today').buses;
}

export function listConductors(ownerId: string): ConductorOption[] {
  const rows = getDb()
    .prepare(`SELECT u.id, u.short_name, u.phone, b.fleet_number
      FROM users u LEFT JOIN buses b ON b.conductor_id = u.id AND b.owner_id = ?
      WHERE u.role = 'conductor' ORDER BY u.short_name`)
    .all(ownerId) as Array<{ id: string; short_name: string; phone: string; fleet_number: string | null }>;
  return rows.map((row) => ({ id: row.id, shortName: row.short_name, phone: row.phone, busFleet: row.fleet_number }));
}

export type OwnerLostItem = {
  id: string;
  category: string;
  description: string;
  status: LostStatus;
  fleetNumber: string;
  whenLabel: string;
  passenger: string | null;
};

export function listOwnerLost(ownerId: string): OwnerLostItem[] {
  const rows = getDb()
    .prepare(`SELECT li.id, li.category, li.description, li.status, li.created_at, b.fleet_number, u.short_name AS passenger
      FROM lost_items li JOIN buses b ON b.id = li.bus_id LEFT JOIN users u ON u.id = li.passenger_id
      WHERE b.owner_id = ? ORDER BY CASE li.status WHEN 'reported' THEN 0 WHEN 'pickup_pending' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END, li.created_at DESC
      LIMIT 40`)
    .all(ownerId) as Array<{
    id: string;
    category: string;
    description: string;
    status: LostStatus;
    created_at: number;
    fleet_number: string;
    passenger: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    fleetNumber: row.fleet_number,
    whenLabel: formatRideWhen(row.created_at),
    passenger: row.passenger,
  }));
}

export function countOpenLost(ownerId: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM lost_items li JOIN buses b ON b.id = li.bus_id WHERE b.owner_id = ? AND li.status = 'reported'`)
    .get(ownerId) as { n: number };
  return row.n;
}

export function registerBus(ownerId: string, fleetRaw: string, plateRaw: string, routeRaw: string) {
  const fleet = normalizeFleetNumber(fleetRaw);
  const plate = cleanText(plateRaw, 20).toUpperCase();
  const route = cleanText(routeRaw, 60);
  if (!/^\d{1,4}$/.test(fleet)) return { ok: false as const, message: 'Use the fleet number painted on the bus, such as 12.' };
  if (plate.length < 4) return { ok: false as const, message: 'Enter the number plate.' };
  if (route.length < 3) return { ok: false as const, message: 'Enter the route, such as Town to Matero.' };
  try {
    const id = nid('bus');
    getDb()
      .prepare(`INSERT INTO buses (id, fleet_number, plate, route, status, owner_id, conductor_id, created_at)
        VALUES (?, ?, ?, ?, 'active', ?, NULL, ?)`)
      .run(id, fleet, plate, route, ownerId, Date.now());
    return { ok: true as const, id, fleetNumber: fleet };
  } catch (error) {
    if (isUnique(error)) return { ok: false as const, message: `Bus ${fleet} is already registered.` };
    throw error;
  }
}

export function setBusStatus(ownerId: string, busId: string, status: 'active' | 'offline') {
  const updated = getDb()
    .prepare(`UPDATE buses SET status = ? WHERE id = ? AND owner_id = ?`)
    .run(status, busId, ownerId);
  if (Number(updated.changes) !== 1) return { ok: false as const, message: 'That bus is not in your fleet.' };
  return { ok: true as const };
}

export function registerConductor(ownerId: string, nameRaw: string, phoneRaw: string, pin: string, busId: string | null) {
  const name = cleanText(nameRaw, 60);
  const phone = normalizePhone(phoneRaw);
  if (name.length < 2) return { ok: false as const, message: 'Enter the conductor’s name.' };
  if (!phone) return { ok: false as const, message: 'Enter a Zambian mobile number for the conductor.' };
  if (!/^\d{4}$/.test(pin)) return { ok: false as const, message: 'Choose a 4-digit PIN for the conductor.' };
  try {
    const id = nid('usr');
    withTransaction(() => {
      getDb()
        .prepare(`INSERT INTO users (id, name, short_name, phone, pin_hash, role, initials, demo, payout_phone, payout_network, created_at)
          VALUES (?, ?, ?, ?, ?, 'conductor', ?, 0, NULL, NULL, ?)`)
        .run(id, name, name.split(/\s+/)[0], phone, hashPin(pin), initialsFrom(name), Date.now());
      getDb().prepare('INSERT INTO wallets (user_id, balance_ngwee) VALUES (?, 0)').run(id);
      if (busId) assignConductorInTransaction(ownerId, busId, id);
    });
    return { ok: true as const, id, phone, shortName: name.split(/\s+/)[0] ?? name };
  } catch (error) {
    if (isUnique(error)) return { ok: false as const, message: 'That phone number is already in use.' };
    return asFail(error);
  }
}

function assignConductorInTransaction(ownerId: string, busId: string, conductorId: string | null) {
  const bus = busById(busId);
  if (!bus || bus.owner_id !== ownerId) throw new UserError('That bus is not in your fleet.');
  if (conductorId) {
    const conductor = userById(conductorId);
    if (!conductor || conductor.role !== 'conductor') throw new UserError('Choose a conductor.');
    getDb().prepare('UPDATE buses SET conductor_id = NULL WHERE conductor_id = ?').run(conductorId);
  }
  getDb().prepare('UPDATE buses SET conductor_id = ? WHERE id = ? AND owner_id = ?').run(conductorId, busId, ownerId);
}

export function assignConductor(ownerId: string, busId: string, conductorId: string | null) {
  try {
    withTransaction(() => assignConductorInTransaction(ownerId, busId, conductorId));
    return { ok: true as const };
  } catch (error) {
    return asFail(error);
  }
}

function earnedNgwee(ownerId: string): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(SUM(r.amount_ngwee), 0) AS amount FROM rides r JOIN buses b ON b.id = r.bus_id
      WHERE b.owner_id = ? AND r.status = 'verified'`)
    .get(ownerId) as { amount: number };
  return row.amount;
}

function heldPayoutNgwee(ownerId: string): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(SUM(amount_ngwee), 0) AS amount FROM payouts WHERE owner_id = ? AND status IN ('paid', 'reserved')`)
    .get(ownerId) as { amount: number };
  return row.amount;
}

function ownerAvailableNgwee(ownerId: string): number {
  return earnedNgwee(ownerId) - heldPayoutNgwee(ownerId);
}

export function getPayoutSummary(ownerId: string): PayoutSummary {
  const user = userById(ownerId);
  const dash = getOwnerDashboard(ownerId, 'today');
  const history = getDb()
    .prepare(`SELECT id, amount_ngwee, status, network, destination, created_at FROM payouts
      WHERE owner_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 20`)
    .all(ownerId) as Array<{ id: string; amount_ngwee: number; status: string; network: string; destination: string; created_at: number }>;
  return {
    availableNgwee: ownerAvailableNgwee(ownerId),
    todayNgwee: dash.totalNgwee,
    nextPayoutNgwee: dash.nextPayoutNgwee,
    payoutPhone: user?.payout_phone ?? null,
    payoutNetwork: user?.payout_network ?? null,
    history: history.map((row) => ({
      id: row.id,
      amountNgwee: row.amount_ngwee,
      status: row.status,
      network: row.network,
      destination: row.destination,
      createdAt: row.created_at,
    })),
  };
}

export function savePayoutDestination(ownerId: string, network: string, destinationRaw: string) {
  const allowed = ['mtn', 'airtel', 'zamtel', 'bank'];
  if (!allowed.includes(network)) return { ok: false as const, message: 'Choose MTN, Airtel, Zamtel, or a bank account.' };
  const destination = network === 'bank' ? cleanText(destinationRaw, 32) : normalizePhone(destinationRaw);
  if (!destination || (network === 'bank' && destination.length < 6)) {
    return { ok: false as const, message: network === 'bank' ? 'Enter the account number.' : 'Enter the mobile-money number.' };
  }
  getDb().prepare('UPDATE users SET payout_network = ?, payout_phone = ? WHERE id = ? AND role = ?').run(network, destination, ownerId, 'owner');
  return { ok: true as const };
}

function releaseReservation(payoutId: string) {
  getDb().prepare(`DELETE FROM payouts WHERE id = ? AND status = 'reserved'`).run(payoutId);
}

export async function requestPayout(ownerId: string, amountRaw: string) {
  const amount = parseMoney(amountRaw, 100_000_000);
  if (amount == null) return { ok: false as const, message: 'Enter a payout of at least K1.' };
  const user = userById(ownerId);
  if (!user) return { ok: false as const, message: 'Sign in again.' };
  const network = (user.payout_network ?? 'mtn') as PayoutNetwork;
  const destination = user.payout_phone ?? user.phone;
  const payoutId = nid('pay');
  try {
    withTransaction(() => {
      const available = ownerAvailableNgwee(ownerId);
      if (amount > available) {
        throw new UserError(`You can pay out up to ${formatBalance(Math.max(available, 0))}.`);
      }
      getDb()
        .prepare(`INSERT INTO payouts (id, owner_id, amount_ngwee, status, network, destination, provider_ref, created_at)
          VALUES (?, ?, ?, 'reserved', ?, ?, NULL, ?)`)
        .run(payoutId, ownerId, amount, network, destination, Date.now());
    });
  } catch (error) {
    return asFail(error);
  }

  let result;
  try {
    result = await getPaymentProvider().payout({
      network,
      destination,
      amountNgwee: amount,
      reference: payoutId,
      ownerId,
    });
  } catch {
    releaseReservation(payoutId);
    return { ok: false as const, message: 'The payout provider did not respond. Nothing was sent.' };
  }
  if (!result.ok) {
    releaseReservation(payoutId);
    return { ok: false as const, message: result.message };
  }
  const updated = getDb()
    .prepare(`UPDATE payouts SET status = 'paid', provider_ref = ? WHERE id = ? AND status = 'reserved'`)
    .run(result.providerRef, payoutId);
  if (Number(updated.changes) !== 1) {
    return { ok: false as const, message: 'The payout could not be recorded. Check payouts before trying again.' };
  }
  return { ok: true as const, message: `${formatBalance(amount)} sent to ${formatPhone(destination)} via ${networkLabel(network)}.` };
}

export function ridesForExport(ownerId: string, range: RangeKey): ExportRide[] {
  const window = rangeWindow(range);
  const rows = getDb()
    .prepare(`SELECT r.created_at, r.code, r.amount_ngwee, r.status, r.passenger_label, r.route_snapshot,
        b.fleet_number, b.plate, u.short_name AS conductor
      FROM rides r JOIN buses b ON b.id = r.bus_id LEFT JOIN users u ON u.id = r.conductor_id
      WHERE b.owner_id = ? AND r.created_at >= ? AND r.created_at < ?
      ORDER BY r.created_at DESC`)
    .all(ownerId, window.start, window.end) as Array<{
    created_at: number;
    code: string;
    amount_ngwee: number;
    status: string;
    passenger_label: string;
    route_snapshot: string;
    fleet_number: string;
    plate: string;
    conductor: string | null;
  }>;
  return rows.map((row) => ({
    createdAt: row.created_at,
    fleetNumber: row.fleet_number,
    plate: row.plate,
    route: row.route_snapshot,
    conductor: row.conductor ?? '',
    passenger: row.passenger_label,
    code: row.code,
    amountNgwee: row.amount_ngwee,
    status: row.status,
  }));
}

export function restoreDemoData() {
  resetDatabase();
}

export function conductorTipBalance(userId: string): number {
  return getBalance(userId);
}

export { formatPhone, lusakaDateKey };
