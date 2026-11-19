import assert from 'node:assert/strict';
import { Client } from 'pg';
import { test } from 'node:test';
import { aheadMetres, aheadSegment, alongError, approachFromDistances, approachLabel, demoSpeed, formatDistance, formatReach, formatSpeed, formatUpdated, glideDistance, glideSpeed, haversineMetres, isStale, pointAlong, projectOnto, reachMinutes, routeEndInDirection, routeLength, shouldSendFix, showsAccuracyHalo, snapToRoad, STALE_MS, trailSamples, trimTrail } from '../lib/tracking-math';
import { routeGeometry } from '../lib/lusaka-routes';
import { describePlace, LUSAKA_LANDMARKS, LUSAKA_STREETS } from '../lib/lusaka-places';

const UNIT_URL = 'postgres://twende:twende@127.0.0.1:5432/twende_unit';

test('stale fixes, road snap, and place names', () => {
  const route = routeGeometry('Town to Matero');
  assert.ok(route);
  const now = 1_000_000;
  assert.equal(isStale(now - STALE_MS - 1, now), true);
  assert.equal(isStale(now - 60_000, now), false);
  assert.equal(shouldSendFix(null, { lat: 1, lng: 1 }, now), true);
  assert.equal(shouldSendFix({ lat: -15.4167, lng: 28.2817, at: now - 5_000 }, { lat: -15.4167, lng: 28.2817 }, now), false);
  assert.equal(shouldSendFix({ lat: -15.4167, lng: 28.2817, at: now - 31_000 }, { lat: -15.4167, lng: 28.2817 }, now), true);
  assert.equal(formatUpdated(now - 12_000, now), 'Updated 12s ago');
  assert.equal(formatUpdated(now - 2_000, now), 'Updated 2s ago');

  const onRoad = route.points[3];
  const off = { lat: onRoad.lat + 0.00025, lng: onRoad.lng };
  const snapped = snapToRoad(off, route.points, 20);
  assert.equal(snapped.snapped, true);
  assert.ok(haversineMetres(snapped, onRoad) < haversineMetres(off, onRoad));
  const loose = snapToRoad(off, route.points, 80);
  assert.equal(loose.snapped, false);
  assert.equal(loose.lat, off.lat);
  assert.equal(loose.lng, off.lng);
  assert.equal(snapToRoad({ lat: onRoad.lat + 0.01, lng: onRoad.lng }, route.points, 10).snapped, false);
  assert.equal(snapToRoad(onRoad, route.points, null).snapped, true);
  assert.equal(showsAccuracyHalo(80), true);
  assert.equal(showsAccuracyHalo(50), false);
  assert.equal(showsAccuracyHalo(null), false);

  const places = [...route.stops, ...LUSAKA_LANDMARKS];
  assert.equal(describePlace(route.points[0], 0, route.points, places, LUSAKA_STREETS), 'Cairo Road, near Town Centre');
  const tower = LUSAKA_LANDMARKS[0];
  assert.equal(describePlace(tower, 90, route.points, places, LUSAKA_STREETS), 'Cairo Road, near Kulima Tower');
  const approaching = pointAlong(route.points, 0.9);
  const nearEnd = describePlace(approaching, approaching.heading, route.points, places, LUSAKA_STREETS);
  assert.equal(nearEnd.includes('Approaching'), false, nearEnd);
  assert.equal(nearEnd.includes('Matero Market'), true, nearEnd);
  const chawama = routeGeometry('Matero to Chawama');
  assert.ok(chawama);
  const midway = pointAlong(chawama.points, 0.45);
  const south = describePlace(midway, midway.heading, chawama.points, [...chawama.stops, ...LUSAKA_LANDMARKS], LUSAKA_STREETS);
  assert.equal(south.startsWith('Kafue Road'), true, south);
  assert.equal(south === 'Lusaka', false);
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

test('distance from you and whether the bus is coming closer', () => {
  assert.equal(approachFromDistances([800, 760, 700]), 'towards');
  assert.equal(approachFromDistances([400, 430, 480]), 'away');
  assert.equal(approachFromDistances([500, 510, 490]), 'passing');
  assert.equal(approachFromDistances([500]), null);
  assert.equal(approachLabel('towards'), 'Coming towards you');
  assert.equal(approachLabel('away'), 'Moving away');
  assert.equal(approachLabel('passing'), 'Passing nearby');
  assert.equal(formatDistance(650), '650 m from you');
  assert.equal(formatDistance(1400), '1.4 km from you');
  assert.equal(formatDistance(650.4), '650 m from you');
  assert.equal(reachMinutes(650, 8, 'towards'), 1);
  assert.equal(reachMinutes(2400, 8, 'towards'), 5);
  assert.equal(reachMinutes(650, 8, 'away'), null);
  assert.equal(reachMinutes(650, 8, 'passing'), null);
  assert.equal(reachMinutes(3500, 8, 'towards'), null);
  assert.equal(reachMinutes(3000, 8, 'towards'), 6);
  assert.equal(reachMinutes(650, 0.2, 'towards'), null);
  assert.equal(reachMinutes(650, null, 'towards'), null);
  assert.equal(formatReach(3), 'Could reach you in ~3 min');
  assert.equal(formatReach(3).includes('~'), true);
  assert.equal(formatSpeed(24 / 3.6), 'Moving · 24 km/h');
  assert.equal(formatSpeed(0.2), 'Stopped');
  assert.equal(formatSpeed(null), 'Stopped');
});

test('direction is the route end ahead, with a short trail behind and no wrap', () => {
  const route = routeGeometry('Town to Matero');
  assert.ok(route);
  const length = routeLength(route.points);
  const along = length * 0.4;
  const reach = aheadMetres(length);
  assert.ok(reach >= 500 && reach <= 1000);
  const segment = aheadSegment(route.points, along, reach);
  assert.ok(segment.coordinates.length >= 2);
  assert.equal(segment.arrows.length, 3);
  const tip = segment.coordinates[segment.coordinates.length - 1];
  const tipAlong = projectOnto(route.points, { lat: tip[1], lng: tip[0] }).along;
  assert.ok(tipAlong > along + 400, String(tipAlong - along));
  assert.ok(tipAlong < along + reach + 40);
  const nearEnd = aheadSegment(route.points, length - 80, 900);
  const endTip = nearEnd.coordinates[nearEnd.coordinates.length - 1];
  assert.ok(endTip);
  const endAlong = projectOnto(route.points, { lat: endTip[1], lng: endTip[0] }).along;
  assert.ok(endAlong > length - 90);
  assert.ok(endAlong <= length + 1);
  assert.equal(routeEndInDirection('Town to Matero', 12, 10), 'Matero');
  assert.equal(routeEndInDirection('Town to Matero', 190, 10), 'Town');
  assert.equal(routeEndInDirection('Matero to Chawama', 0, 5), 'Chawama');
  const trail = trailSamples(route.points, along, 400, 1_000_000);
  assert.ok(trail.length >= 3);
  assert.ok(trail[0].at < trail[trail.length - 1].at);
  assert.ok(haversineMetres(trail[0], trail[trail.length - 1]) > 300);
  assert.equal(trailSamples(route.points, 10, 400, 1_000_000).length, 0);
  const trimmed = trimTrail(trail, 180);
  assert.ok(trimmed.length >= 2);
  assert.ok(trimmed.length < trail.length);
  assert.ok(haversineMetres(trimmed[0], trimmed[trimmed.length - 1]) <= 200);
});

test('a bus glides forward along the road and does not jump backward', () => {
  const length = 5_000;
  const base = demoSpeed(length);
  assert.ok(base > 20 && base < 40);
  assert.ok(Math.abs(glideDistance(100, base, 1 / 60) - (100 + base / 60)) < 0.001);
  assert.equal(glideDistance(100, base, 5), 100 + base * 0.1);
  assert.equal(alongError(100, 160, length), 60);
  assert.equal(alongError(100, length - 20, length) < 0, true);
  const behind = glideSpeed(base, -400);
  assert.ok(behind > 0);
  assert.ok(glideSpeed(base, 80) > base);
});

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
