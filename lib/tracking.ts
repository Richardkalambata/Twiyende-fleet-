import { randomBytes } from 'node:crypto';
import { getDb, type Db } from './db';
import { LUSAKA_LANDMARKS } from './lusaka-places';
import { LUSAKA_ROUTES, routeGeometry, type GeoPoint } from './lusaka-routes';
import { DAY_MS, lusakaDateKey, startOfLusakaDay } from './time';
import {
  FALLBACK_SPEED_MPS,
  etaMinutes,
  haversineMetres,
  isStale,
  pointAlong,
  shouldSendFix,
} from './tracking-math';

const WEEK_MS = 7 * DAY_MS;
const CONDUCTOR_HOLD_MS = 45_000;

export type LiveBus = {
  id: string;
  fleet: string;
  route: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recordedAt: number;
  stale: boolean;
  onShift: boolean;
  conductor?: string | null;
};

type LatestRow = {
  bus_id: string;
  fleet_number: string;
  route: string;
  owner_id: string;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recorded_at: number | null;
  source: string | null;
  conductor_name: string | null;
  shift_open: boolean;
};

function id(prefix: string) {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

export function simulatedEnabled(): boolean {
  return process.env.SIMULATED !== '0';
}

async function assignedBus(conductorId: string) {
  const today = lusakaDateKey();
  return (await getDb()).get<{ id: string; fleet_number: string; route: string }>(
    `SELECT b.id, b.fleet_number, b.route FROM assignments a JOIN buses b ON b.id = a.bus_id
     WHERE a.conductor_id = ? AND a.shift_date = ? LIMIT 1`,
    conductorId,
    today,
  );
}

export async function openShift(conductorId: string) {
  const now = Date.now();
  const db = await getDb();
  await db.run(`UPDATE shifts SET ended_at = ? WHERE conductor_id = ? AND ended_at IS NULL AND expires_at <= ?`, now, conductorId, now);
  return db.get<{ id: string; bus_id: string; started_at: number; expires_at: number }>(
    `SELECT id, bus_id, started_at, expires_at FROM shifts WHERE conductor_id = ? AND ended_at IS NULL AND expires_at > ? ORDER BY started_at DESC LIMIT 1`,
    conductorId,
    now,
  );
}

export async function startShift(conductorId: string) {
  const bus = await assignedBus(conductorId);
  if (!bus) return { ok: false as const, message: 'No bus is assigned to you today.' };
  const existing = await openShift(conductorId);
  if (existing) return { ok: true as const, busId: existing.bus_id, fleet: bus.fleet_number, route: bus.route, startedAt: existing.started_at, already: true };
  const now = Date.now();
  const expires = startOfLusakaDay(new Date(now)) + DAY_MS;
  await (await getDb()).run(
    `INSERT INTO shifts (id, conductor_id, bus_id, started_at, ended_at, expires_at) VALUES (?, ?, ?, ?, NULL, ?)`,
    id('shf'),
    conductorId,
    bus.id,
    now,
    expires,
  );
  return { ok: true as const, busId: bus.id, fleet: bus.fleet_number, route: bus.route, startedAt: now, already: false };
}

export async function endShift(conductorId: string) {
  const now = Date.now();
  await (await getDb()).run(`UPDATE shifts SET ended_at = ? WHERE conductor_id = ? AND ended_at IS NULL`, now, conductorId);
  return { ok: true as const };
}

export async function recordConductorLocation(
  conductorId: string,
  busId: string,
  point: { lat: number; lng: number; heading?: number | null; speed?: number | null; accuracy?: number | null },
) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) {
    return { ok: false as const, message: 'That location is not valid.' };
  }
  const bus = await assignedBus(conductorId);
  if (!bus || bus.id !== busId) return { ok: false as const, message: 'You can only share the bus assigned to you.' };
  const shift = await openShift(conductorId);
  if (!shift || shift.bus_id !== busId) return { ok: false as const, message: 'Start your shift before sharing location.' };
  const now = Date.now();
  const db = await getDb();
  const previous = await db.get<{ lat: number; lng: number; recorded_at: number }>(
    `SELECT lat, lng, recorded_at FROM bus_latest WHERE bus_id = ? AND source = 'conductor'`,
    busId,
  );
  if (previous && !shouldSendFix({ lat: previous.lat, lng: previous.lng, at: previous.recorded_at }, point, now)) {
    return { ok: true as const, skipped: true };
  }
  const speed = point.speed ?? (previous ? haversineMetres(previous, point) / Math.max(1, (now - previous.recorded_at) / 1000) : null);
  await db.run(
    `INSERT INTO bus_locations (id, bus_id, lat, lng, heading, speed, accuracy, recorded_at, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'conductor')`,
    id('loc'),
    busId,
    point.lat,
    point.lng,
    point.heading ?? null,
    speed,
    point.accuracy ?? null,
    now,
  );
  await db.run(
    `INSERT INTO bus_latest (bus_id, lat, lng, heading, speed, accuracy, recorded_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'conductor')
     ON CONFLICT (bus_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, heading = EXCLUDED.heading,
       speed = EXCLUDED.speed, accuracy = EXCLUDED.accuracy, recorded_at = EXCLUDED.recorded_at, source = 'conductor'`,
    busId,
    point.lat,
    point.lng,
    point.heading ?? null,
    speed,
    point.accuracy ?? null,
    now,
  );
  await db.run(`DELETE FROM bus_locations WHERE recorded_at < ?`, now - WEEK_MS);
  return { ok: true as const, skipped: false };
}

async function advanceSimulator(now = Date.now()) {
  if (!simulatedEnabled()) return;
  const db = await getDb();
  const buses = await db.all<{ id: string; route: string }>(`SELECT id, route FROM buses ORDER BY fleet_number`);
  for (const [index, bus] of buses.entries()) {
    const geometry = routeGeometry(bus.route);
    if (!geometry) continue;
    const latest = await db.get<{ source: string; recorded_at: number; lat: number; lng: number }>(
      `SELECT source, recorded_at, lat, lng FROM bus_latest WHERE bus_id = ?`,
      bus.id,
    );
    if (latest?.source === 'conductor' && now - latest.recorded_at < CONDUCTOR_HOLD_MS) continue;
    const spot = pointAlong(geometry.points, ((now / (12 * 60 * 1000)) + index * 0.17) % 1);
    if (latest && !shouldSendFix({ lat: latest.lat, lng: latest.lng, at: latest.recorded_at }, spot, now) && latest.source === 'simulated') continue;
    const speed = latest ? haversineMetres(latest, spot) / Math.max(1, (now - latest.recorded_at) / 1000) : FALLBACK_SPEED_MPS;
    await db.run(
      `INSERT INTO bus_locations (id, bus_id, lat, lng, heading, speed, accuracy, recorded_at, source) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'simulated')`,
      id('loc'),
      bus.id,
      spot.lat,
      spot.lng,
      spot.heading,
      Math.min(18, Math.max(3, speed)),
      now,
    );
    await db.run(
      `INSERT INTO bus_latest (bus_id, lat, lng, heading, speed, accuracy, recorded_at, source)
       VALUES (?, ?, ?, ?, ?, NULL, ?, 'simulated')
       ON CONFLICT (bus_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, heading = EXCLUDED.heading,
         speed = EXCLUDED.speed, recorded_at = EXCLUDED.recorded_at, source = 'simulated'`,
      bus.id,
      spot.lat,
      spot.lng,
      spot.heading,
      Math.min(18, Math.max(3, speed)),
      now,
    );
  }
}

export async function ensureStops(db?: Db) {
  const query = db ?? await getDb();
  for (const route of LUSAKA_ROUTES) {
    for (const [index, stop] of route.stops.entries()) {
      const stopId = `stop_${route.route.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${index}`;
      await query.run(
        `INSERT INTO stops (id, route, name, lat, lng, seq) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        stopId,
        route.route,
        stop.name,
        stop.lat,
        stop.lng,
        index,
      );
    }
  }
  for (const [index, place] of LUSAKA_LANDMARKS.entries()) {
    const slug = place.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await query.run(
      `INSERT INTO stops (id, route, name, lat, lng, seq) VALUES (?, 'Landmarks', ?, ?, ?, ?)
       ON CONFLICT (id) DO NOTHING`,
      `stop_landmark_${slug}`,
      place.name,
      place.lat,
      place.lng,
      index,
    );
  }
}

export async function stopsFor(route: string) {
  return (await getDb()).all<{ id: string; name: string; lat: number; lng: number; seq: number }>(
    `SELECT id, name, lat, lng, seq FROM stops WHERE route = ? ORDER BY seq`,
    route,
  );
}

export async function listLiveBuses(viewer: { id: string; role: string }, now = Date.now()): Promise<LiveBus[]> {
  await advanceSimulator(now);
  const db = await getDb();
  const operator = viewer.role === 'operator' || viewer.role === 'owner';
  const rows = await db.all<LatestRow>(
    `SELECT b.id AS bus_id, b.fleet_number, b.route, b.owner_id,
            l.lat, l.lng, l.heading, l.speed, l.accuracy, l.recorded_at, l.source,
            u.short_name AS conductor_name,
            EXISTS (
              SELECT 1 FROM shifts s WHERE s.bus_id = b.id AND s.ended_at IS NULL AND s.expires_at > ?
            ) AS shift_open
     FROM buses b
     LEFT JOIN bus_latest l ON l.bus_id = b.id
     LEFT JOIN assignments a ON a.bus_id = b.id AND a.shift_date = ?
     LEFT JOIN users u ON u.id = a.conductor_id
     ${operator ? 'WHERE b.owner_id = ?' : ''}
     ORDER BY b.fleet_number`,
    ...(operator ? [now, lusakaDateKey(new Date(now)), viewer.id] : [now, lusakaDateKey(new Date(now))]),
  );
  return rows.flatMap((row) => {
    if (row.lat == null || row.lng == null || row.recorded_at == null) {
      if (!operator) return [];
      return [{
        id: row.bus_id,
        fleet: row.fleet_number,
        route: row.route,
        lat: -15.4167,
        lng: 28.2817,
        heading: null,
        speed: null,
        accuracy: null,
        recordedAt: 0,
        stale: true,
        onShift: false,
        conductor: row.conductor_name,
      }];
    }
    const stale = isStale(row.recorded_at, now);
    const simulated = row.source === 'simulated';
    const onShift = Boolean(row.shift_open) || simulated;
    if (!operator && !onShift) return [];
    const bus: LiveBus = {
      id: row.bus_id,
      fleet: row.fleet_number,
      route: row.route,
      lat: row.lat,
      lng: row.lng,
      heading: row.heading,
      speed: row.speed,
      accuracy: row.accuracy,
      recordedAt: row.recorded_at,
      stale,
      onShift,
    };
    if (operator) bus.conductor = row.conductor_name;
    return [bus];
  });
}

export async function trailFor(operatorId: string, busId: string) {
  const start = startOfLusakaDay();
  const rows = await (await getDb()).all<{ lat: number; lng: number }>(
    `SELECT l.lat, l.lng FROM bus_locations l
     JOIN buses b ON b.id = l.bus_id
     WHERE l.bus_id = ? AND b.owner_id = ? AND l.recorded_at >= ?
     ORDER BY l.recorded_at
     LIMIT 300`,
    busId,
    operatorId,
    start,
  );
  return rows;
}

export async function etaForStop(route: string, bus: GeoPoint, stop: GeoPoint, speed: number | null) {
  const geometry = routeGeometry(route);
  const line = geometry?.points ?? [bus, stop];
  return etaMinutes(line, bus, stop, speed);
}
