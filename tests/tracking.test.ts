import assert from 'node:assert/strict';
import { Client } from 'pg';
import { test } from 'node:test';
import { etaMinutes, formatEta, isStale, shouldSendFix, STALE_MS } from '../lib/tracking-math';
import { routeGeometry } from '../lib/lusaka-routes';

const UNIT_URL = 'postgres://twende:twende@127.0.0.1:5432/twende_unit';

test('eta and stale logic', () => {
  const route = routeGeometry('Town to Matero');
  assert.ok(route);
  const minutes = etaMinutes(route.points, route.points[0], route.stops[route.stops.length - 1], 8);
  assert.ok(minutes >= 1 && minutes < 40);
  assert.equal(formatEta(minutes), `~${minutes} min`);
  assert.equal(etaMinutes(route.points, route.points[0], route.stops[2], null) >= 1, true);
  const now = 1_000_000;
  assert.equal(isStale(now - STALE_MS - 1, now), true);
  assert.equal(isStale(now - 60_000, now), false);
  assert.equal(shouldSendFix(null, { lat: 1, lng: 1 }, now), true);
  assert.equal(shouldSendFix({ lat: -15.4167, lng: 28.2817, at: now - 5_000 }, { lat: -15.4167, lng: 28.2817 }, now), false);
  assert.equal(shouldSendFix({ lat: -15.4167, lng: 28.2817, at: now - 31_000 }, { lat: -15.4167, lng: 28.2817 }, now), true);
});

async function useUnit() {
  const incoming = process.env.DATABASE_URL ?? '';
  if (incoming && !/localhost|127\.0\.0\.1/.test(incoming)) throw new Error('Refusing to run tests against a non-local DATABASE_URL.');
  const admin = new Client({ connectionString: 'postgres://twende:twende@127.0.0.1:5432/postgres' });
  await admin.connect();
  const found = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', ['twende_unit']);
  if (found.rowCount === 0) await admin.query('CREATE DATABASE twende_unit');
  await admin.end();
  process.env.DATABASE_URL = UNIT_URL;
  process.env.DATABASE_URL_UNPOOLED = UNIT_URL;
  process.env.SIMULATED = '0';
}

test('a conductor can only post a location for their own bus', async () => {
  await useUnit();
  const { IDS } = await import('../lib/constants.ts');
  const { resetDatabase } = await import('../lib/db.ts');
  const tracking = await import('../lib/tracking.ts');
  await resetDatabase();
  const before = await tracking.recordConductorLocation(IDS.mwila, IDS.bus12, { lat: -15.41, lng: 28.28 });
  assert.equal(before.ok, false);
  const started = await tracking.startShift(IDS.mwila);
  assert.equal(started.ok, true);
  const own = await tracking.recordConductorLocation(IDS.mwila, IDS.bus12, { lat: -15.41, lng: 28.28 });
  assert.equal(own.ok, true);
  const otherBus = await tracking.recordConductorLocation(IDS.mwila, IDS.bus15, { lat: -15.42, lng: 28.29 });
  assert.equal(otherBus.ok, false);
  const otherConductor = await tracking.recordConductorLocation(IDS.chanda, IDS.bus12, { lat: -15.41, lng: 28.28 });
  assert.equal(otherConductor.ok, false);
  const rider = await tracking.recordConductorLocation(IDS.richard, IDS.bus12, { lat: -15.41, lng: 28.28 });
  assert.equal(rider.ok, false);
});
