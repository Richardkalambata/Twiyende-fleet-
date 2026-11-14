import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { formatBalance, formatCompact, formatGrouped, formatPercent } from '../lib/money';
import { confusingCodeMessage, normalizeFleetNumber, randomCode } from '../lib/codes';

test('money formatting and fare codes', () => {
  assert.equal(formatBalance(12000), 'K 120.00');
  assert.equal(formatBalance(124500), 'K 1,245.00');
  assert.equal(formatCompact(500), 'K5');
  assert.equal(formatCompact(50050), 'K500.50');
  assert.equal(formatGrouped(124500), 'K 1,245');
  assert.equal(formatGrouped(34000), 'K 340');
  assert.deepEqual(formatPercent(124500, 105000), { text: '18.6%', up: true });
  assert.equal(normalizeFleetNumber(' Bus 12 '), '12');
  const code = randomCode(4);
  assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  assert.match(confusingCodeMessage('A0K3') ?? '', /0, O, 1 and I/);
  assert.equal(confusingCodeMessage('A7K3'), null);
});

test('passenger pay, conductor verify, lost and found, owner totals', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twende-'));
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://twende:twende@127.0.0.1:5432/twende_test';
  process.env.DEMO_ROLE_SWITCHER = '1';
  process.env.PAYMENT_PROVIDER = 'simulated';

  const { IDS } = await import('../lib/constants.ts');
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
  assert.equal(dash.topConductor?.name, 'Bwalya');
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
  if (logged.ok) assert.equal(logged.matched, false);

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
  const createdConductor = (await service.registerConductor(IDS.owner, 'Tembo Phiri', '0975550199', '2468', null));
  assert.equal(createdConductor.ok, true);
  if (createdConductor.ok && createdBus.ok) {
    const assigned = (await service.assignConductor(IDS.owner, createdBus.id, createdConductor.id));
    assert.equal(assigned.ok, true);
    const login = (await service.authenticate('0975550199', '2468'));
    assert.equal(login.ok, true);
    if (login.ok) assert.equal((await service.getConductorHome(login.user.id)).bus?.fleet_number, '44');
  }

  const payout = await service.requestPayout(IDS.owner, '10');
  assert.equal(payout.ok, true);
  const summary = (await service.getPayoutSummary(IDS.owner));
  assert.ok(summary.availableNgwee > 0);
  assert.equal(summary.history[0]?.amountNgwee, 1000);

  const umbrellaTrip = (await service.listReportableTrips(IDS.richard)).find((trip) => trip.fleetNumber === '12');
  assert.ok(umbrellaTrip);
  const matched = await service.reportLost(IDS.richard, umbrellaTrip.id, 'umbrella', 'Black umbrella left on the seat', null, true);
  assert.equal(matched.ok, true);
  if (matched.ok) {
    assert.equal(matched.matched, true);
    const matchedItem = (await service.getPassengerLostItem(IDS.richard, matched.itemId));
    assert.equal(matchedItem?.status, 'pickup_pending');
    assert.equal(matchedItem?.smsSent, true);
  }

  const wholeKwacha = String(Math.floor((await service.getPayoutSummary(IDS.owner)).availableNgwee / 100));
  const [firstPayout, secondPayout] = await Promise.all([
    service.requestPayout(IDS.owner, wholeKwacha),
    service.requestPayout(IDS.owner, wholeKwacha),
  ]);
  assert.equal([firstPayout.ok, secondPayout.ok].filter(Boolean).length, 1);
  const afterPayouts = (await service.getPayoutSummary(IDS.owner));
  assert.ok(afterPayouts.availableNgwee >= 0);
  assert.ok(afterPayouts.availableNgwee < 100);

  assert.equal((await service.authenticate('0971000001', '0000')).ok, false);
  assert.equal((await service.authenticate('0971 000 001', '1234')).ok, true);
  assert.equal((await service.authenticateDemo(IDS.owner)).ok, true);
  process.env.DEMO_ROLE_SWITCHER = '0';
  assert.equal((await service.authenticateDemo(IDS.owner)).ok, false);
});
