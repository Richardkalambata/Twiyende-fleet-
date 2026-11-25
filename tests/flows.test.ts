import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from 'pg';
import { test } from 'node:test';
import { formatBalance, formatCompact, formatGrouped, formatPercent } from '../lib/money';
import { confusingCodeMessage, normalizeFleetNumber, randomCode } from '../lib/codes';
import { timeGreeting } from '../lib/time';
import { csvCell } from '../lib/text';
import { readTrackingRequest } from '../lib/tracking-request';
import { assertLocalServer, assertSafeDatabase } from './db-guard';

const UNIT_URL = 'postgres://twende:twende@127.0.0.1:5432/twende_unit';

async function useIsolatedDatabase() {
  const incoming = process.env.DATABASE_URL ?? '';
  if (incoming && !/localhost|127\.0\.0\.1/.test(incoming)) {
    throw new Error('Refusing to run tests against a non-local DATABASE_URL.');
  }
  const admin = new Client({ connectionString: 'postgres://twende:twende@127.0.0.1:5432/postgres' });
  await admin.connect();
  const found = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', ['twende_unit']);
  if (found.rowCount === 0) await admin.query('CREATE DATABASE twende_unit');
  await admin.end();
  process.env.DATABASE_URL = UNIT_URL;
  process.env.DATABASE_URL_UNPOOLED = UNIT_URL;
}

test('e2e and capture refuse the production database', () => {
  assert.throws(() => assertSafeDatabase('postgres://user:secret@ep.neon.tech/neondb', 'e2e'), /production database/);
  assert.throws(() => assertSafeDatabase('postgres://twende:twende@127.0.0.1:5432/twende_test', 'capture'), /production database/);
  assert.throws(() => assertSafeDatabase('postgres://twende:twende@127.0.0.1:5432/twende', 'e2e'), /production database/);
  assert.throws(() => assertSafeDatabase('postgres://twende:twende@127.0.0.1:5432/twende_unit', 'capture'), /twende_e2e/);
  assert.doesNotThrow(() => assertSafeDatabase(undefined, 'e2e'));
  assert.doesNotThrow(() => assertSafeDatabase('postgres://twende:twende@127.0.0.1:5432/twende_e2e', 'capture'));
  assert.throws(() => assertLocalServer('https://twende-zm.vercel.app', 'capture'), /local server/);
  assert.throws(() => assertLocalServer('http://127.0.0.1:3040', 'e2e'), /3050/);
  assert.doesNotThrow(() => assertLocalServer('http://127.0.0.1:3050', 'e2e'));
});

test('money formatting and fare codes', () => {
  assert.equal(formatBalance(12000), 'K120.00');
  assert.equal(formatBalance(124500), 'K1,245.00');
  assert.equal(formatCompact(500), 'K5');
  assert.equal(formatCompact(50050), 'K500.50');
  assert.equal(formatGrouped(124500), 'K1,245.00');
  assert.equal(formatGrouped(34000), 'K340.00');
  assert.deepEqual(formatPercent(124500, 105000), { text: '18.6%', up: true });
  assert.equal(normalizeFleetNumber(' Bus 12 '), '12');
  const code = randomCode(4);
  assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  assert.match(confusingCodeMessage('A0K3') ?? '', /0, O, 1 and I/);
  assert.equal(confusingCodeMessage('A7K3'), null);
  assert.equal(timeGreeting(new Date('2026-11-18T21:32:00Z')), 'Good evening');
  assert.equal(timeGreeting(new Date('2026-11-18T08:00:00Z')), 'Good morning');
});

test('sensitive API requests and CSV cells keep their input boundaries', async () => {
  const endpoint = 'https://fleet.example.test/api/shifts';
  function request(origin: string, body: string, type = 'application/json') {
    return new Request(endpoint, { method: 'POST', body, headers: { origin, 'content-type': type } });
  }
  const origin = new URL(endpoint).origin;
  const correct = await readTrackingRequest(request(origin, '{"action":"start"}'));
  assert.deepEqual(correct, { ok: true, body: { action: 'start' } });
  const behindAdapter = await readTrackingRequest(new Request('https://internal.example.test/api/shifts', {
    method: 'POST',
    body: '{"action":"start"}',
    headers: { host: 'fleet.example.test', origin, 'content-type': 'application/json' },
  }));
  assert.ok(behindAdapter.ok);
  const otherSite = await readTrackingRequest(request('https://other.example.test', '{"action":"start"}'));
  assert.ok(!otherSite.ok && otherSite.status === 403);
  const plainText = await readTrackingRequest(request(origin, '{"action":"start"}', 'text/plain'));
  assert.ok(!plainText.ok && plainText.status === 415);
  const oversized = await readTrackingRequest(request(origin, JSON.stringify({ note: 'é'.repeat(600) })));
  assert.ok(!oversized.ok && oversized.status === 413);
  const malformed = await readTrackingRequest(request(origin, '[]'));
  assert.ok(!malformed.ok && malformed.status === 400);
  assert.equal(csvCell('Town to Matero'), 'Town to Matero');
  assert.equal(csvCell('   =1'), "'   =1");
  assert.equal(csvCell('＋1'), "'＋1");
  assert.equal(csvCell('First\rSecond'), '"First\rSecond"');
});

test('passenger pay, conductor verify, lost and found, owner totals', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twende-'));
  await useIsolatedDatabase();
  process.env.DEMO_ROLE_SWITCHER = '1';
  process.env.PAYMENT_PROVIDER = 'simulated';

  const { IDS, PHONES } = await import('../lib/constants.ts');
  const service = await import('../lib/service.ts');
  const { resetDatabase } = await import('../lib/db.ts');
  await resetDatabase();

  const dash = (await service.getOwnerDashboard(IDS.owner, 'today'));
  assert.equal(dash.rides, 249);
  assert.equal(dash.totalNgwee, 124_500);
  assert.equal(dash.previousRides, 210);
  assert.equal(dash.previousNgwee, 105_000);
  assert.equal(dash.activeBuses, 4);
  assert.equal(dash.totalBuses, 6);
  assert.equal(dash.nextPayoutNgwee, 124_500);
  assert.equal(dash.openLost, 1);
  const bus12 = dash.buses.find((bus) => bus.fleetNumber === '12');
  const bus15 = dash.buses.find((bus) => bus.fleetNumber === '15');
  const bus21 = dash.buses.find((bus) => bus.fleetNumber === '21');
  const bus34 = dash.buses.find((bus) => bus.fleetNumber === '34');
  assert.equal(bus12?.rides, 68);
  assert.equal(bus12?.earningsNgwee, 34_000);
  assert.equal(bus12?.conductorName, 'Mwila');
  assert.equal(bus15?.earningsNgwee, 29_500);
  assert.equal(bus21?.earningsNgwee, 36_000);
  assert.equal(bus21?.rides, 72);
  assert.equal(bus34?.earningsNgwee, 25_000);
  assert.equal(dash.topConductor?.name, 'Bwalya Mwamba');
  assert.equal(dash.topConductor?.earningsNgwee, 36_000);
  assert.equal(dash.chart.length, 16);
  assert.equal(
    dash.chart.reduce((sum, point) => sum + point.value, 0),
    124_500,
  );

  const home = (await service.getPassengerHome(IDS.richard));
  assert.equal(home.balanceNgwee, 12_000);
  assert.equal(home.rides[0]?.fleetNumber, '12');
  assert.equal(home.rides[0]?.route, 'Town to Matero');
  assert.match(home.rides[0]?.whenLabel ?? '', /^Today,/);
  assert.equal(home.rides[1]?.fleetNumber, '18');
  assert.equal(home.rides[1]?.route, 'Matero to Chawama');
  assert.match(home.rides[1]?.whenLabel ?? '', /^Yesterday,/);

  const mwila = (await service.getConductorHome(IDS.mwila));
  assert.equal(mwila.todayRides, 68);
  assert.equal(mwila.todayNgwee, 34_000);
  assert.equal(mwila.bus?.fleet_number, '12');

  const found = (await service.getPassengerLostItem(IDS.richard, 'lost_richard_phone'));
  assert.equal(found?.pickupCode, 'P9X2');
  assert.equal(found?.status, 'pickup_pending');
  assert.equal(found?.conductorName, 'Mwila');
  const conductorLost = (await service.getConductorLost(IDS.mwila));
  assert.equal(JSON.stringify(conductorLost).includes('P9X2'), false);
  assert.equal(conductorLost.alerts.length, 1);
  assert.match(conductorLost.alerts[0]?.description ?? '', /Samsung/);
  assert.equal(conductorLost.alerts[0]?.tripLabel, '10:42');
  assert.ok(conductorLost.items.some((item) => item.category === 'umbrella' && item.status === 'waiting'));
  assert.ok(conductorLost.items.some((item) => item.category === 'phone' && item.status === 'pickup_pending'));

  const tip = (await service.sendTip(IDS.richard, 'lost_richard_phone', 1000));
  assert.equal(tip.ok, true);
  if (tip.ok) assert.equal(tip.balanceNgwee, 11_000);
  const tippedAgain = (await service.sendTip(IDS.richard, 'lost_richard_phone', 1000));
  assert.equal(tippedAgain.ok, false);

  const wrongPickup = (await service.verifyPickup(IDS.mwila, 'ZZZZ'));
  assert.equal(wrongPickup.ok, false);
  const closed = (await service.verifyPickup(IDS.mwila, 'p9x2'));
  assert.equal(closed.ok, true);
  const closedAgain = (await service.verifyPickup(IDS.owner, 'P9X2'));
  assert.equal(closedAgain.ok, false);

  const offline = (await service.payFare(IDS.richard, '18', '5'));
  assert.equal(offline.ok, false);
  const missing = (await service.payFare(IDS.richard, '99', '5'));
  assert.equal(missing.ok, false);
  const badFare = (await service.payFare(IDS.richard, '12', '0'));
  assert.equal(badFare.ok, false);

  const paid = (await service.payFare(IDS.richard, 'Bus 12', '5'));
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.match(paid.code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  assert.equal(paid.balanceNgwee, 10_500);
  assert.equal(paid.fleetNumber, '12');

  const tracking = await import('../lib/tracking.ts');
  const offShift = await service.verifyCode(IDS.mwila, paid.code);
  assert.equal(offShift.ok, false);
  if (!offShift.ok) assert.match(offShift.message, /Start your shift/);
  assert.equal((await tracking.startShift(IDS.chanda)).ok, true);
  assert.equal((await tracking.startShift(IDS.mwila)).ok, true);
  assert.ok((await service.listNotifications(IDS.richard)).some((notice) => notice.title === 'Fare paid' && notice.href.endsWith(paid.rideId)));
  assert.ok((await service.listNotifications(IDS.mwila)).some((notice) => notice.title === 'New fare payment'));
  const wrongBus = (await service.verifyCode(IDS.chanda, paid.code));
  assert.equal(wrongBus.ok, false);
  if (!wrongBus.ok) assert.match(wrongBus.message, /Bus 12/);
  const verified = (await service.verifyCode(IDS.mwila, paid.code.toLowerCase()));
  assert.equal(verified.ok, true);
  if (verified.ok) {
    assert.equal(verified.amountNgwee, 500);
    assert.equal(verified.todayRides, 69);
    assert.equal(verified.todayNgwee, 34_500);
  }
  const reused = (await service.verifyCode(IDS.mwila, paid.code));
  assert.equal(reused.ok, false);
  if (!reused.ok) assert.match(reused.message, /Already used/);

  const after = (await service.getOwnerDashboard(IDS.owner, 'today'));
  assert.equal(after.rides, 250);
  assert.equal(after.totalNgwee, 125_000);
  assert.equal(after.buses.find((bus) => bus.fleetNumber === '12')?.rides, 69);

  const second = (await service.payFare(IDS.richard, '12', '5'));
  assert.equal(second.ok, true);
  if (!second.ok) return;
  const cancelled = (await service.cancelFare(IDS.richard, second.rideId));
  assert.equal(cancelled.ok, true);
  if (cancelled.ok) assert.equal(cancelled.balanceNgwee, 10_500);
  assert.ok((await service.listNotifications(IDS.richard)).some((notice) => notice.title === 'Fare refunded' && notice.href.endsWith(second.rideId)));
  const voided = (await service.verifyCode(IDS.mwila, second.code));
  assert.equal(voided.ok, false);
  if (!voided.ok) assert.match(voided.message, /cancelled/);

  const trips = (await service.listReportableTrips(IDS.richard));
  const report = await service.reportLost(IDS.richard, trips[0]!.id, 'bag', 'Canvas tote, green straps', null, true);
  assert.equal(report.ok, true);
  if (!report.ok) return;
  const alerts = (await service.getConductorLost(IDS.mwila)).alerts;
  assert.ok(alerts.some((alert) => alert.id === report.itemId));
  const foundIt = await service.markFound(IDS.mwila, report.itemId);
  assert.equal(foundIt.ok, true);
  const detail = (await service.getPassengerLostItem(IDS.richard, report.itemId));
  assert.equal(detail?.status, 'pickup_pending');
  assert.match(detail?.pickupCode ?? '', /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  assert.equal(JSON.stringify((await service.getConductorLost(IDS.mwila))).includes(detail?.pickupCode ?? 'none'), false);
  const handover = (await service.verifyPickup(IDS.owner, detail?.pickupCode ?? ''));
  assert.equal(handover.ok, true);
  assert.equal((await service.getPassengerLostItem(IDS.richard, report.itemId))?.status, 'closed');

  const logged = await service.logFoundItem(IDS.chanda, 'wallet', 'Brown leather wallet', null);
  assert.equal(logged.ok, true);

  const namwinga = (await service.getConductorLost(IDS.mwila)).alerts.find((alert) => alert.description.includes('Samsung'));
  assert.ok(namwinga);
  const notFound = (await service.markNotFound(IDS.mwila, namwinga.id));
  assert.equal(notFound.ok, true);
  assert.equal((await service.getOwnerDashboard(IDS.owner, 'today')).openLost, 0);

  const topped = await service.topUp(IDS.richard, 'mtn', '0971000001', '20');
  assert.equal(topped.ok, true);
  if (topped.ok) assert.equal(topped.balanceNgwee, 12_500);

  const poor = (await service.payFare(IDS.richard, '12', '100'));
  assert.equal(poor.ok, true);
  const broke = (await service.payFare(IDS.richard, '12', '100'));
  assert.equal(broke.ok, false);
  if (!broke.ok) assert.match(broke.message, /Not enough balance/);

  const createdBus = (await service.registerBus(IDS.owner, '44', 'BLZ 44 ZA', 'Town to Mtendere'));
  assert.equal(createdBus.ok, true);
  const duplicate = (await service.registerBus(IDS.owner, '44', 'BLZ 44 ZA', 'Town to Mtendere'));
  assert.equal(duplicate.ok, false);
  const createdConductor = (await service.registerConductor(IDS.owner, 'Tembo Phiri', '0975550199', '246810', null));
  assert.equal(createdConductor.ok, true);
  if (createdConductor.ok && createdBus.ok) {
    const assigned = (await service.assignConductor(IDS.owner, createdBus.id, createdConductor.id));
    assert.equal(assigned.ok, true);
    const login = (await service.authenticate('0975550199', '246810'));
    assert.equal(login.ok, true);
    if (login.ok) assert.equal((await service.getConductorHome(login.user.id)).bus?.fleet_number, '44');
  }

  const owner = await service.authenticate(PHONES.owner, '123456');
  assert.ok(owner.ok);
  const { getDb } = await import('../lib/db.ts');
  const db = await getDb();
  const initialPayouts = await service.getPayoutSummary(IDS.owner);
  await db.run(`INSERT INTO payouts (id, owner_id, amount_ngwee, status, network, destination, created_at)
    VALUES (?, ?, ?, 'paid', 'settlement', ?, ?)`, 'legacy-settlement', IDS.owner, 500, 'Bus 12', Date.now());
  assert.equal((await service.getPayoutSummary(IDS.owner)).availableNgwee, initialPayouts.availableNgwee);
  const requestId = crypto.randomUUID();
  const [payout, retry] = await Promise.all([
    service.requestPayout(IDS.owner, '10', requestId, owner.pinHash),
    service.requestPayout(IDS.owner, '10', requestId, owner.pinHash),
  ]);
  assert.ok(payout.ok && retry.ok);
  assert.equal((await service.requestPayout(IDS.owner, '11', requestId, owner.pinHash)).ok, false);
  assert.equal((await service.requestPayout(IDS.owner, '10', crypto.randomUUID(), 'stale-pin-hash')).ok, false);
  assert.ok((await service.listNotifications(IDS.owner)).some((notice) => notice.title === 'Test payout recorded' && notice.body.includes('No money was sent')));
  const summary = (await service.getPayoutSummary(IDS.owner));
  assert.equal(summary.availableNgwee, initialPayouts.availableNgwee - 1000);
  assert.equal(summary.history.length, initialPayouts.history.length + 1);
  assert.ok(summary.availableNgwee > 0);
  assert.equal(summary.history[0]?.amountNgwee, 1000);

  const umbrellaTrip = (await service.listReportableTrips(IDS.richard)).find((trip) => trip.fleetNumber === '12');
  assert.ok(umbrellaTrip);
  const umbrellaReport = await service.reportLost(IDS.richard, umbrellaTrip.id, 'umbrella', 'Black umbrella left on the seat', null, true);
  assert.equal(umbrellaReport.ok, true);
  if (umbrellaReport.ok) {
    const unverified = await service.getPassengerLostItem(IDS.richard, umbrellaReport.itemId);
    assert.equal(unverified?.status, 'reported');
    assert.equal(unverified?.pickupCode, null);
    assert.ok((await service.getConductorLost(IDS.mwila)).items.some((item) => item.category === 'umbrella' && item.status === 'waiting'));
    assert.equal((await service.markFound(IDS.mwila, umbrellaReport.itemId)).ok, true);
    const matchedItem = await service.getPassengerLostItem(IDS.richard, umbrellaReport.itemId);
    assert.equal(matchedItem?.status, 'pickup_pending');
    assert.equal(matchedItem?.smsSent, true);
    assert.ok(matchedItem?.pickupCode);
    assert.ok(!(await service.verifyPickup(IDS.chanda, matchedItem.pickupCode)).ok);
    const { getDb } = await import('../lib/db.ts');
    await (await getDb()).run('UPDATE lost_items SET pickup_until = ? WHERE id = ?', Date.now() - 1, umbrellaReport.itemId);
    const expired = await service.verifyPickup(IDS.mwila, matchedItem.pickupCode);
    assert.ok(!expired.ok && /expired/.test(expired.message));
    const expiredDetails = await service.getPassengerLostItem(IDS.richard, umbrellaReport.itemId);
    assert.equal(expiredDetails?.status, 'pickup_pending');
    assert.equal(expiredDetails.pickupCode, null);
    assert.equal((await service.markFound(IDS.mwila, umbrellaReport.itemId)).ok, true);
    const renewed = await service.getPassengerLostItem(IDS.richard, umbrellaReport.itemId);
    assert.ok(renewed?.pickupCode && renewed.pickupCode !== matchedItem.pickupCode);
    assert.equal((await service.verifyPickup(IDS.mwila, matchedItem.pickupCode)).ok, false);
    assert.equal((await service.verifyPickup(IDS.mwila, renewed.pickupCode)).ok, true);
  }

  const wholeKwacha = String(Math.floor((await service.getPayoutSummary(IDS.owner)).availableNgwee / 100));
  const [firstPayout, secondPayout] = await Promise.all([
    service.requestPayout(IDS.owner, wholeKwacha, crypto.randomUUID(), owner.pinHash),
    service.requestPayout(IDS.owner, wholeKwacha, crypto.randomUUID(), owner.pinHash),
  ]);
  assert.equal([firstPayout.ok, secondPayout.ok].filter(Boolean).length, 1);
  const afterPayouts = (await service.getPayoutSummary(IDS.owner));
  assert.ok(afterPayouts.availableNgwee >= 0);
  assert.ok(afterPayouts.availableNgwee < 100);

  assert.equal((await service.authenticate('0971000001', '0000')).ok, false);
  assert.equal((await service.authenticate('0971 000 001', '123456')).ok, true);
  assert.equal((await service.authenticateDemo(IDS.owner)).ok, true);
  process.env.DEMO_ROLE_SWITCHER = '0';
  assert.equal((await service.authenticateDemo(IDS.owner)).ok, false);
});

test('signup, pin, support, fare options, and code expiry', async () => {
  await useIsolatedDatabase();
  process.env.PAYMENT_PROVIDER = 'simulated';
  const service = await import('../lib/service.ts');
  const { getDb, resetDatabase } = await import('../lib/db.ts');
  const { IDS } = await import('../lib/constants.ts');
  await resetDatabase();
  const created = await service.signupPassenger({ name: 'Amina Banda', phone: '0973333444', pin: '432109', network: 'mtn' });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal((await service.changePin(created.id, '0000', '111109')).ok, false);
  const db = await getDb();
  await db.run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', 'previous-session', created.id, Date.now() + 60_000);
  assert.equal((await service.changePin(created.id, '432109', '111109')).ok, true);
  assert.equal(await db.get('SELECT 1 FROM sessions WHERE user_id = ?', created.id), null);
  assert.equal((await service.authenticate('0973333444', '432109')).ok, false);
  assert.equal((await service.authenticate('0973333444', '111109')).ok, true);
  const attempts = await Promise.all(Array.from({ length: 5 }, () => service.changePin(created.id, '000000', '222222')));
  assert.equal(attempts.filter((attempt) => !attempt.ok && /Too many tries/.test(attempt.message)).length, 1);
  const topped = await service.topUp(created.id, 'mtn', '0973333444', '20');
  assert.equal(topped.ok, true);
  const paid = await service.payFare(created.id, '12', '5');
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  const { startShift } = await import('../lib/tracking.ts');
  assert.equal((await startShift(IDS.mwila)).ok, true);
  const verified = await service.verifyCode(IDS.mwila, paid.code);
  assert.equal(verified.ok, true);
  const ticket = await service.openSupport(created.id, 'Card reader', 'The conductor could not see my code.');
  assert.equal(ticket.ok, true);
  if (!ticket.ok) return;
  assert.equal(await service.readSupportThread(IDS.mwila, 'passenger', ticket.id), null);
  assert.equal((await service.readSupportThread(IDS.owner, 'operator', ticket.id))?.messages.length, 1);
  assert.equal((await service.replySupport(IDS.owner, 'operator', ticket.id, 'We can help with that.', false)).ok, true);
  assert.equal((await service.replySupport(created.id, 'passenger', ticket.id, 'Thank you.', true)).ok, true);
  const thread = await service.readSupportThread(created.id, 'passenger', ticket.id);
  assert.equal(thread?.messages.length, 3);
  assert.equal(thread?.status, 'open');
  assert.equal((await service.replySupport(IDS.owner, 'operator', ticket.id, 'Resolved.', true)).ok, true);
  assert.equal((await service.replySupport(created.id, 'passenger', ticket.id, 'One more thing.', false)).ok, false);
  const fare = await service.addRouteFare(IDS.owner, 'Town to Matero', '7');
  assert.equal(fare.ok, true);
  const wrongFare = await service.payFare(created.id, '12', '5');
  assert.equal(wrongFare.ok, false);
  assert.equal((await service.payFare(created.id, '12', '7')).ok, true);
});

test('fleet notifications are scoped and termination expires account access', async () => {
  await useIsolatedDatabase();
  process.env.DEMO_ROLE_SWITCHER = '1';
  const service = await import('../lib/service.ts');
  const { getDb, resetDatabase } = await import('../lib/db.ts');
  const { startShift, endShift, openShift, syncExpiredFleetShifts } = await import('../lib/tracking.ts');
  const { IDS, PHONES } = await import('../lib/constants.ts');
  const { DAY_MS, lusakaDateKey } = await import('../lib/time.ts');
  await resetDatabase();

  assert.equal((await startShift(IDS.mwila)).ok, true);
  assert.equal((await startShift(IDS.mwila)).ok, true);
  await endShift(IDS.mwila);
  await endShift(IDS.mwila);
  const notices = await service.listNotifications(IDS.owner);
  assert.equal(notices.filter((notice) => notice.title === 'Shift started').length, 1);
  assert.equal(notices.filter((notice) => notice.title === 'Shift ended').length, 1);
  const alert = notices.find((notice) => notice.title === 'Shift started')!;
  await service.markNotificationRead(IDS.richard, alert.id);
  assert.equal((await service.listNotifications(IDS.owner)).find((notice) => notice.id === alert.id)?.unread, true);
  await service.markNotificationRead(IDS.owner, alert.id);
  assert.equal((await service.listNotifications(IDS.owner)).find((notice) => notice.id === alert.id)?.unread, false);
  assert.equal((await service.savePayoutDestination(IDS.owner, 'airtel', PHONES.mwila)).ok, false);

  assert.equal((await startShift(IDS.mwila)).ok, true);
  const expiringShift = await openShift(IDS.mwila);
  assert.ok(expiringShift);
  await (await getDb()).run('UPDATE shifts SET expires_at = ? WHERE id = ?', Date.now() - 1, expiringShift.id);
  await syncExpiredFleetShifts(IDS.owner);
  await syncExpiredFleetShifts(IDS.owner);
  assert.equal(await openShift(IDS.mwila), null);
  assert.equal((await service.listNotifications(IDS.owner)).filter((notice) => notice.title === 'Shift ended').length, 2);

  const conductor = await service.authenticate(PHONES.mwila, '123456');
  assert.ok(conductor.ok);
  assert.equal((await service.saveConductorPayoutDestination(IDS.mwila, 'mtn', PHONES.mwila, 'stale-pin-hash')).ok, false);
  assert.equal((await service.saveConductorPayoutDestination(IDS.mwila, 'mtn', PHONES.mwila, conductor.pinHash)).ok, true);
  const payoutArgs = [IDS.owner, IDS.mwila, '5', lusakaDateKey(), '7d425664-c705-4616-b71f-6ad57ded51ea', 'TEST-123'] as const;
  assert.equal((await service.recordConductorPayout(...payoutArgs)).ok, true);
  assert.equal((await service.recordConductorPayout(...payoutArgs)).ok, true);
  assert.equal((await service.listNotifications(IDS.owner)).filter((notice) => notice.title === 'Conductor payout recorded').length, 1);
  assert.equal((await service.listNotifications(IDS.mwila)).filter((notice) => notice.title === 'Payout recorded').length, 1);

  assert.equal((await service.assignConductor(IDS.owner, IDS.bus15, IDS.mwila)).ok, true);
  assert.ok((await service.listNotifications(IDS.mwila)).some((notice) => notice.title === 'Bus assigned' && notice.body.includes('15')));
  assert.equal((await startShift(IDS.mwila)).ok, true);
  assert.equal((await service.terminateConductor(IDS.richard, IDS.mwila)).ok, false);
  const before = Date.now();
  assert.equal((await service.terminateConductor(IDS.owner, IDS.mwila)).ok, true);
  assert.equal((await service.terminateConductor(IDS.owner, IDS.mwila)).ok, false);
  assert.equal(await openShift(IDS.mwila), null);
  assert.equal((await service.saveConductorPayoutDestination(IDS.mwila, 'mtn', '0975550199', conductor.pinHash)).ok, false);
  assert.equal((await startShift(IDS.mwila)).ok, false);
  assert.equal((await service.assignConductor(IDS.owner, IDS.bus15, IDS.mwila)).ok, false);
  const account = await service.getPublicUser(IDS.mwila);
  assert.ok(account?.conductorClosesAt && account.conductorClosesAt >= before + DAY_MS);
  assert.ok((await service.listNotifications(IDS.mwila)).some((notice) => notice.title === 'Your conductor account is closing'));
  assert.equal((await service.authenticate(PHONES.mwila, '123456')).ok, true);

  await (await getDb()).run('UPDATE users SET conductor_closes_at = ? WHERE id = ?', Date.now() - 1, IDS.mwila);
  assert.equal(await service.getPublicUser(IDS.mwila), null);
  assert.equal((await service.authenticate(PHONES.mwila, '123456')).ok, false);
  assert.equal((await service.authenticateDemo(IDS.mwila)).ok, false);
});

test('collection retries, duplicate callbacks and provider references post one balanced credit', async () => {
  await useIsolatedDatabase();
  const { IDS } = await import('../lib/constants.ts');
  const { getDb } = await import('../lib/db.ts');
  const { startCollection, recordVerifiedCollection, CollectionConflict } = await import('../lib/payments/collections.ts');
  const db = await getDb();
  await db.exec(fs.readFileSync(new URL('../migrations/003_collection_ledger.sql', import.meta.url), 'utf8'));

  const input = { riderId: IDS.richard, requestKey: crypto.randomUUID(), provider: 'test', merchant: 'staging', amountNgwee: 2_000 };
  const [first, replay] = await Promise.all([startCollection(input), startCollection(input)]);
  assert.equal(replay.id, first.id);
  await assert.rejects(startCollection({ ...input, amountNgwee: 2_100 }), CollectionConflict);
  await assert.rejects(startCollection({ ...input, riderId: IDS.owner }), CollectionConflict);

  const confirmed = { collectionId: first.id, provider: 'test', merchant: 'staging', transactionId: crypto.randomUUID(), eventId: crypto.randomUUID(), amountNgwee: 2_000, currency: 'ZMW' };
  const other = await startCollection({ ...input, requestKey: crypto.randomUUID() });
  await assert.rejects(recordVerifiedCollection({ ...confirmed, amountNgwee: 1_999 }), CollectionConflict);
  await assert.rejects(recordVerifiedCollection({ ...confirmed, merchant: 'other' }), CollectionConflict);
  await assert.rejects(recordVerifiedCollection({ ...confirmed, currency: 'USD' }), CollectionConflict);
  assert.equal(await db.get('SELECT 1 FROM payment_collection_postings WHERE collection_id = ?', first.id), null);
  assert.deepEqual((await Promise.all([
    recordVerifiedCollection(confirmed),
    recordVerifiedCollection(confirmed),
    recordVerifiedCollection({ ...confirmed, eventId: crypto.randomUUID() }),
  ])).sort(), ['already-posted', 'already-posted', 'posted']);
  await assert.rejects(recordVerifiedCollection({ ...confirmed, transactionId: crypto.randomUUID() }), CollectionConflict);
  await assert.rejects(recordVerifiedCollection({ ...confirmed, collectionId: other.id, eventId: crypto.randomUUID() }), CollectionConflict);
  await assert.rejects(recordVerifiedCollection({ ...confirmed, collectionId: other.id, transactionId: crypto.randomUUID() }), CollectionConflict);
  assert.equal(await db.get('SELECT 1 FROM payment_collection_postings WHERE collection_id = ?', other.id), null);
  assert.deepEqual(await db.get('SELECT amount_ngwee, currency FROM payment_collection_postings WHERE collection_id = ?', first.id), { amount_ngwee: 2_000, currency: 'ZMW' });
  await assert.rejects(db.run('UPDATE payment_collection_postings SET amount_ngwee = 1 WHERE collection_id = ?', first.id), /append-only/);
  await assert.rejects(db.run('DELETE FROM payment_collection_postings WHERE collection_id = ?', first.id), /append-only/);
});

test('the same fare retry returns one receipt and debits the wallet once', async () => {
  await useIsolatedDatabase();
  const { IDS } = await import('../lib/constants.ts');
  const { getBalance, payFare, getFareBusOption } = await import('../lib/service.ts');
  const { resetDatabase } = await import('../lib/db.ts');
  await resetDatabase();
  assert.equal((await getFareBusOption('12'))?.route, 'Town to Matero');
  assert.equal(await getFareBusOption('18'), null);

  const before = await getBalance(IDS.richard);
  const key = crypto.randomUUID();
  const [initial, retry] = await Promise.all([
    payFare(IDS.richard, '12', '5', key), payFare(IDS.richard, '12', '5', key),
  ]);
  assert.ok(initial.ok && retry.ok);
  assert.equal(initial.rideId, retry.rideId);
  assert.equal(initial.code, retry.code);
  assert.equal(await getBalance(IDS.richard), before - 500);
  assert.equal((await payFare(IDS.richard, '12', '10', key)).ok, false);

  const previous = process.env.TWENDE_ENV;
  process.env.TWENDE_ENV = 'production';
  try {
    const { topUp, requestPayout, signupPassenger, signupOperator } = await import('../lib/service.ts');
    const { requiresOperatorSms } = await import('../lib/operator-sms-policy.ts');
    assert.equal(requiresOperatorSms(), true);
    assert.equal((await topUp(IDS.richard, 'mtn', '0971000001', '10')).ok, false);
    assert.equal((await requestPayout(IDS.owner, '10', crypto.randomUUID(), 'unused')).ok, false);
    assert.equal((await payFare(IDS.richard, '12', '5')).ok, false);
    const applicant = { name: 'Test Applicant', phone: '0971234567', pin: '246810', network: 'mtn' };
    assert.equal((await signupPassenger(applicant)).ok, false);
    assert.equal((await signupOperator({ ...applicant, company: 'Test Fleet' })).ok, false);
  } finally {
    if (previous === undefined) delete process.env.TWENDE_ENV;
    else process.env.TWENDE_ENV = previous;
  }
});
