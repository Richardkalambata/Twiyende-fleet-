import { randomBytes } from 'node:crypto';
import { getDb, withTransaction, type Db } from './db';
import { notifyShift } from './notifications';
import { LUSAKA_LANDMARKS } from './lusaka-places';
import { demoRoutePath, LUSAKA_ROUTES } from './lusaka-routes';
import { DAY_MS, lusakaDateKey, startOfLusakaDay } from './time';
import {
  DEMO_LOOP_MS,
  demoSpeed,
  haversineMetres,
  isStale,
  pointAlong,
  routeLength,
  shouldSendFix,
} from './tracking-math';

const WEEK_MS = 7 * DAY_MS;
const CONDUCTOR_HOLD_MS = 45_000;
const SIMULATION_INTERVAL_MS = 5_000;
const SIMULATION_LOCK = 872346;
const LOCATION_PRUNE_INTERVAL_MS = 60 * 60_000;

export type LiveBus = {
  id: string;
  fleet: string;
  route: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recordedAt: number;
  stale: boolean;
  onShift: boolean;
  simulated?: boolean;
  conductor?: string | null;
  ownFleet?: boolean;
};

type LatestRow = {
  bus_id: string;
  fleet_number: string;
  route: string | null;
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
  return process.env.TWENDE_ENV !== 'production' && process.env.SIMULATED !== '0';
}

async function assignedBus(conductorId: string) {
  return (await getDb()).get<{ id: string; fleet_number: string; route: string | null }>(
    `SELECT b.id, b.fleet_number, b.route FROM buses b
     JOIN users u ON u.id = ? AND u.operator_id = b.owner_id
     WHERE u.conductor_closes_at IS NULL AND b.status = 'active' AND (
       b.conductor_id = u.id OR EXISTS (
         SELECT 1 FROM assignments a WHERE a.conductor_id = u.id AND a.bus_id = b.id AND a.shift_date = ?
       )
     ) ORDER BY (b.conductor_id = u.id) DESC NULLS LAST, b.id LIMIT 1`,
    conductorId, lusakaDateKey(),
  );
}

export async function openShift(conductorId: string) {
  return (await getDb()).get<{ id: string; bus_id: string; started_at: number; expires_at: number }>(
    `SELECT id, bus_id, started_at, expires_at FROM shifts WHERE conductor_id = ? AND ended_at IS NULL AND expires_at > ? ORDER BY started_at DESC LIMIT 1`,
    conductorId, Date.now(),
  );
}

async function closeExpiredShifts(scope: { conductorId: string } | { operatorId: string }, now: number) {
  const db = await getDb();
  const byConductor = 'conductorId' in scope;
  const ended = await db.all<{ conductor_id: string; bus_id: string }>(
    `UPDATE shifts SET ended_at = expires_at WHERE ended_at IS NULL AND expires_at <= ? AND
     ${byConductor ? 'conductor_id = ?' : 'bus_id IN (SELECT id FROM buses WHERE owner_id = ?)'}
     RETURNING conductor_id, bus_id`, now, byConductor ? scope.conductorId : scope.operatorId,
  );
  for (const shift of ended) await notifyShift(shift.conductor_id, shift.bus_id, 'ended');
}

export async function syncExpiredFleetShifts(operatorId: string) {
  const now = Date.now();
  const expired = await (await getDb()).get(
    `SELECT 1 FROM shifts s JOIN buses b ON b.id = s.bus_id
     WHERE b.owner_id = ? AND s.ended_at IS NULL AND s.expires_at <= ? LIMIT 1`, operatorId, now,
  );
  if (expired) await withTransaction(() => closeExpiredShifts({ operatorId }, now));
}

export async function startShift(conductorId: string) {
  return withTransaction(async () => {
    const db = await getDb();
    const conductor = await db.get<{ operator_id: string | null }>(
      "SELECT operator_id FROM users WHERE id = ? AND role = 'conductor'", conductorId,
    );
    if (!conductor?.operator_id) return { ok: false as const, message: 'No bus is assigned to you.' };
    await db.run('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', `fleet-assignment:${conductor.operator_id}`);
    const bus = await assignedBus(conductorId);
    if (!bus) return { ok: false as const, message: 'No active bus is assigned to you.' };
    const now = Date.now();
    await closeExpiredShifts({ conductorId }, now);
    const existing = await openShift(conductorId);
    if (existing) {
      return { ok: true as const, busId: existing.bus_id, fleet: bus.fleet_number, route: bus.route, startedAt: existing.started_at, already: true };
    }
    const expires = startOfLusakaDay(new Date(now)) + DAY_MS;
    await db.run(
      'INSERT INTO shifts (id, conductor_id, bus_id, started_at, ended_at, expires_at) VALUES (?, ?, ?, ?, NULL, ?)',
      id('shf'), conductorId, bus.id, now, expires,
    );
    await notifyShift(conductorId, bus.id, 'started');
    return { ok: true as const, busId: bus.id, fleet: bus.fleet_number, route: bus.route, startedAt: now, already: false };
  });
}

export async function endShift(conductorId: string) {
  return withTransaction(async () => {
    const now = Date.now();
    const ended = await (await getDb()).all<{ bus_id: string }>(
      'UPDATE shifts SET ended_at = LEAST(expires_at, ?) WHERE conductor_id = ? AND ended_at IS NULL RETURNING bus_id',
      now, conductorId,
    );
    for (const shift of ended) await notifyShift(conductorId, shift.bus_id, 'ended');
    return { ok: true as const };
  });
}

export async function recordConductorLocation(
  conductorId: string,
  busId: string,
  point: { lat: number; lng: number; heading?: number | null; speed?: number | null; accuracy?: number | null },
) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) {
    return { ok: false as const, message: 'That location is not valid.' };
  }
  return withTransaction(async () => {
    const bus = await assignedBus(conductorId);
    if (!bus || bus.id !== busId) return { ok: false as const, message: 'You can only share the bus assigned to you.' };
    const db = await getDb();
    const shift = await db.get<{ expires_at: number; started_at: number }>(
      'SELECT expires_at, started_at FROM shifts WHERE conductor_id = ? AND bus_id = ? AND ended_at IS NULL AND expires_at > ? LIMIT 1 FOR UPDATE',
      conductorId, busId, Date.now(),
    );
    const now = Date.now();
    if (!shift || Number(shift.expires_at) <= now) {
      return { ok: false as const, message: 'Start your shift before sharing location.' };
    }
    const previous = await db.get<{ lat: number; lng: number; recorded_at: number }>(
      `SELECT lat, lng, recorded_at FROM bus_latest WHERE bus_id = ? AND source = 'conductor' AND recorded_at >= ?`,
      busId, shift.started_at,
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
  });
}

async function advanceSimulator(now = Date.now()) {
  if (!simulatedEnabled()) return;
  await withTransaction(async () => {
    const db = await getDb();
    const locked = await db.get<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock(?) AS acquired', SIMULATION_LOCK);
    if (!locked?.acquired) return;
    const previous = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'last_simulated_locations'");
    if (previous && now - Number(previous.value) < SIMULATION_INTERVAL_MS) return;
    const buses = await db.all<{ id: string; route: string }>(
      "SELECT id, route FROM buses WHERE status = 'active' AND route IS NOT NULL ORDER BY fleet_number",
    );
    const points = buses.flatMap((bus, index) => {
      const path = demoRoutePath(bus.route);
      if (path.length < 2) return [];
      const spot = pointAlong(path, ((now / DEMO_LOOP_MS) + index * 0.17) % 1);
      return [{ bus_id: bus.id, ...spot, speed: demoSpeed(routeLength(path)) }];
    });
    await db.run(
      `WITH fixes AS (
        INSERT INTO bus_latest (bus_id, lat, lng, heading, speed, accuracy, recorded_at, source)
        SELECT bus_id, lat, lng, heading, speed, NULL, ?, 'simulated'
        FROM jsonb_to_recordset(?::jsonb) AS point(bus_id text, lat double precision, lng double precision,
          heading double precision, speed double precision)
        ORDER BY bus_id
        ON CONFLICT (bus_id) DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, heading = EXCLUDED.heading,
          speed = EXCLUDED.speed, accuracy = NULL, recorded_at = EXCLUDED.recorded_at, source = EXCLUDED.source
        WHERE bus_latest.recorded_at < EXCLUDED.recorded_at
          AND (bus_latest.source <> 'conductor' OR bus_latest.recorded_at <= ?)
        RETURNING bus_id, lat, lng, heading, speed, recorded_at, source
      )
      INSERT INTO bus_locations (id, bus_id, lat, lng, heading, speed, recorded_at, source)
      SELECT 'sim_' || bus_id || '_' || recorded_at, bus_id, lat, lng, heading, speed, recorded_at, source FROM fixes`,
      now, JSON.stringify(points), now - CONDUCTOR_HOLD_MS,
    );
    await db.run(`INSERT INTO meta (key, value) VALUES ('last_simulated_locations', ?)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, String(now));
    if (!previous || Math.floor(Number(previous.value) / LOCATION_PRUNE_INTERVAL_MS) < Math.floor(now / LOCATION_PRUNE_INTERVAL_MS)) {
      await db.run("DELETE FROM bus_locations WHERE source = 'simulated' AND recorded_at < ?", now - WEEK_MS);
    }
  });
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
              SELECT 1 FROM shifts s WHERE s.bus_id = b.id AND s.conductor_id = b.conductor_id
              AND s.ended_at IS NULL AND s.expires_at > ? AND s.started_at <= l.recorded_at
              AND l.source = 'conductor' AND b.status = 'active'
            ) AS shift_open
     FROM buses b
     LEFT JOIN bus_latest l ON l.bus_id = b.id
     LEFT JOIN assignments a ON a.bus_id = b.id AND a.shift_date = ?
     LEFT JOIN users u ON u.id = a.conductor_id
     WHERE CASE WHEN ?::boolean THEN b.owner_id = ? ELSE b.status = 'active' END
     ORDER BY b.fleet_number`,
    now, lusakaDateKey(new Date(now)), operator, viewer.id,
  );
  return rows.flatMap((row) => {
    const ownFleet = operator && row.owner_id === viewer.id;
    if (row.lat == null || row.lng == null || row.recorded_at == null) {
      if (!ownFleet) return [];
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
        ownFleet: true,
      }];
    }
    const stale = isStale(row.recorded_at, now) || (row.source === 'conductor' && !row.shift_open);
    const simulated = row.source === 'simulated' && simulatedEnabled();
    const onShift = Boolean(row.shift_open) || simulated;
    if (!ownFleet && (!onShift || stale)) return [];
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
      simulated,
    };
    if (ownFleet) {
      bus.ownFleet = true;
      bus.conductor = row.conductor_name;
    }
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

