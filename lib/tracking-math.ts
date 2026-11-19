import type { GeoPoint } from './lusaka-routes';

export const STALE_MS = 3 * 60 * 1000;
export const MOVE_METRES = 15;
export const SEND_GAP_MS = 30 * 1000;
export const FALLBACK_SPEED_MPS = 8;
/** Demo buses complete their corridor in three minutes. The map glides at this same rate. */
export const DEMO_LOOP_MS = 180_000;

export function demoSpeed(lengthMetres: number): number {
  if (lengthMetres <= 0) return FALLBACK_SPEED_MPS;
  return lengthMetres / (DEMO_LOOP_MS / 1000);
}

/** Signed metres from the shown distance to the server distance, wrapped so the bus never turns around. */
export function alongError(shown: number, server: number, length: number): number {
  if (length <= 0) return 0;
  const shownMod = ((shown % length) + length) % length;
  let error = server - shownMod;
  if (error > length / 2) error -= length;
  if (error < -length / 2) error += length;
  return error;
}

/** Ease toward the server position over about two seconds, without reversing. */
export function glideSpeed(base: number, errorMetres: number): number {
  return Math.max(base * 0.35, base + errorMetres / 2);
}

/** Advance along the corridor. Callers cap dt so a paused tab cannot fling the pin. */
export function glideDistance(along: number, speed: number, dtSeconds: number): number {
  const dt = Math.max(0, Math.min(dtSeconds, 0.1));
  return along + Math.max(0, speed) * dt;
}

export function isStale(recordedAt: number, now: number): boolean {
  return now - recordedAt > STALE_MS;
}

/** Lusaka service box. The rider map cannot pan outside it. */
export const LUSAKA_BOUNDS = { south: -15.50, north: -15.35, west: 28.22, east: 28.40 };
/** A rider standing near Cairo Road and Great East Road. Used while demo buses are running. */
export const DEMO_RIDER = { lat: -15.4142, lng: 28.2904, accuracy: 35 };
export const RIDER_JOIN_M = 30_000;
export const OPEN_FRAME_M = 3_000;

export function inLusaka(point: GeoPoint): boolean {
  return point.lat >= LUSAKA_BOUNDS.south && point.lat <= LUSAKA_BOUNDS.north
    && point.lng >= LUSAKA_BOUNDS.west && point.lng <= LUSAKA_BOUNDS.east;
}

/** A real fix only counts when it is inside Lusaka and close to a bus. Georgia must not pull the map open. */
export function riderCounts(you: GeoPoint, nearestBus: GeoPoint): boolean {
  return inLusaka(you) && haversineMetres(you, nearestBus) <= RIDER_JOIN_M;
}

export function haversineMetres(a: GeoPoint, b: GeoPoint): number {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function shouldSendFix(previous: (GeoPoint & { at: number }) | null, next: GeoPoint, now: number): boolean {
  if (!previous) return true;
  if (now - previous.at >= SEND_GAP_MS) return true;
  return haversineMetres(previous, next) > MOVE_METRES;
}

function cumulative(points: GeoPoint[]): number[] {
  const out = [0];
  for (let index = 1; index < points.length; index += 1) {
    out.push(out[index - 1] + haversineMetres(points[index - 1], points[index]));
  }
  return out;
}

export function routeLength(points: GeoPoint[]): number {
  if (points.length < 2) return 0;
  const totals = cumulative(points);
  return totals[totals.length - 1] || 0;
}

export function pointAlong(points: GeoPoint[], fraction: number): GeoPoint & { heading: number } {
  if (points.length === 0) return { lat: -15.4167, lng: 28.2817, heading: 0 };
  if (points.length === 1) return { ...points[0], heading: 0 };
  const length = routeLength(points) || 1;
  const distance = Math.min(length, Math.max(0, fraction)) * length;
  return pointAtDistance(points, distance);
}

function pointOnRoute(points: GeoPoint[], metres: number, wrap: boolean): GeoPoint & { heading: number } {
  if (points.length === 0) return { lat: -15.4167, lng: 28.2817, heading: 0 };
  if (points.length === 1) return { ...points[0], heading: 0 };
  const totals = cumulative(points);
  const length = totals[totals.length - 1] || 1;
  const wrapped = ((metres % length) + length) % length;
  const distance = wrap ? wrapped : Math.min(length, Math.max(0, metres));
  let index = 1;
  while (index < totals.length - 1 && totals[index] < distance) index += 1;
  const start = totals[index - 1];
  const span = totals[index] - start || 1;
  const t = (distance - start) / span;
  const a = points[index - 1];
  const b = points[index];
  const heading = (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, heading };
}

export function pointAtDistance(points: GeoPoint[], metres: number): GeoPoint & { heading: number } {
  return pointOnRoute(points, metres, true);
}

/** How far ahead to draw when a bus is selected. Stays on the corridor, about 500 m to 1 km. */
export function aheadMetres(length: number): number {
  if (length <= 0) return 0;
  return Math.min(1000, Math.max(500, Math.round(length * 0.16)));
}

export type AheadSegment = {
  coordinates: [number, number][];
  arrows: { lng: number; lat: number; heading: number }[];
};

/** The road in front of the bus. Stops at the route end instead of jumping back to the start. */
export function aheadSegment(points: GeoPoint[], along: number, metres: number): AheadSegment {
  const length = routeLength(points);
  if (points.length < 2 || length <= 0 || metres <= 0) return { coordinates: [], arrows: [] };
  const from = ((along % length) + length) % length;
  const reach = Math.min(metres, Math.max(0, length - from));
  if (reach < 30) return { coordinates: [], arrows: [] };
  const steps = 8;
  const coordinates: [number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const spot = pointOnRoute(points, from + (reach * step) / steps, false);
    coordinates.push([spot.lng, spot.lat]);
  }
  const arrows = [0.34, 0.67, 1].map((fraction) => {
    const spot = pointOnRoute(points, from + reach * fraction, false);
    return { lng: spot.lng, lat: spot.lat, heading: spot.heading };
  });
  return { coordinates, arrows };
}

export type TrailSample = { at: number; lng: number; lat: number };

/** Keep the recent part of a trail, about the last few hundred metres, so it stays a tail. */
export function trimTrail(samples: TrailSample[], maxMetres: number): TrailSample[] {
  if (samples.length < 2 || maxMetres <= 0) return samples;
  const kept: TrailSample[] = [samples[samples.length - 1]];
  let travelled = 0;
  for (let index = samples.length - 2; index >= 0; index -= 1) {
    travelled += haversineMetres(samples[index + 1], samples[index]);
    if (travelled > maxMetres) break;
    kept.push(samples[index]);
  }
  return kept.reverse();
}

/** Positions behind the bus covering the last stretch it travelled, without crossing a route wrap. */
export function trailSamples(points: GeoPoint[], along: number, metres: number, now: number, spanMs = 45_000): TrailSample[] {
  const length = routeLength(points);
  if (points.length < 2 || length <= 0 || metres < 20) return [];
  const from = ((along % length) + length) % length;
  const back = Math.min(metres, from);
  if (back < 20) return [];
  const steps = Math.max(2, Math.min(16, Math.round(back / 35)));
  const samples: TrailSample[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const spot = pointOnRoute(points, from - back + (back * step) / steps, false);
    samples.push({ at: now - spanMs * (1 - step / steps), lng: spot.lng, lat: spot.lat });
  }
  return samples;
}

/** Place name at the end of the route in the direction the bus is travelling. */
export function routeEndInDirection(route: string, travelHeading: number, forwardHeading: number): string {
  const parts = route.split(' to ').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? route;
  const delta = Math.abs(((travelHeading - forwardHeading + 540) % 360) - 180);
  return delta > 90 ? parts[0] : parts[parts.length - 1];
}

export type Projection = GeoPoint & { distance: number; heading: number; along: number };

export function bearingDegrees(a: GeoPoint, b: GeoPoint): number {
  return (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI;
}

export function projectOnto(points: GeoPoint[], point: GeoPoint): Projection {
  if (points.length === 0) return { ...point, distance: 0, heading: 0, along: 0 };
  if (points.length === 1) return { ...points[0], distance: haversineMetres(point, points[0]), heading: 0, along: 0 };
  const totals = cumulative(points);
  let best: Projection = { lat: points[0].lat, lng: points[0].lng, distance: Infinity, heading: 0, along: 0 };
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const abLat = b.lat - a.lat;
    const abLng = b.lng - a.lng;
    const denom = abLat * abLat + abLng * abLng || 1;
    const t = Math.min(1, Math.max(0, ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / denom));
    const projected = { lat: a.lat + abLat * t, lng: a.lng + abLng * t };
    const gap = haversineMetres(point, projected);
    if (gap < best.distance) {
      best = {
        ...projected,
        distance: gap,
        heading: bearingDegrees(a, b),
        along: totals[index - 1] + haversineMetres(a, projected),
      };
    }
  }
  return best;
}

/** Snap only when the fix is trustworthy and already close to the corridor. */
export const SNAP_ACCURACY_M = 50;
export const SNAP_MAX_OFFSET_M = 80;

export function showsAccuracyHalo(accuracy: number | null | undefined): boolean {
  return accuracy != null && accuracy > SNAP_ACCURACY_M;
}

export function snapToRoad(point: GeoPoint, route: GeoPoint[], accuracy: number | null): GeoPoint & { snapped: boolean; heading: number } {
  if (route.length < 2) return { ...point, snapped: false, heading: 0 };
  const hit = projectOnto(route, point);
  const trustworthy = accuracy == null || accuracy <= SNAP_ACCURACY_M;
  if (trustworthy && hit.distance <= SNAP_MAX_OFFSET_M) {
    return { lat: hit.lat, lng: hit.lng, snapped: true, heading: hit.heading };
  }
  return { lat: point.lat, lng: point.lng, snapped: false, heading: hit.heading };
}

export function accuracyRing(center: GeoPoint, metres: number, steps = 32): [number, number][] {
  const latRad = (center.lat * Math.PI) / 180;
  const ring: [number, number][] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const north = metres * Math.cos(angle);
    const east = metres * Math.sin(angle);
    const lat = center.lat + north / 111320;
    const lng = center.lng + east / (111320 * Math.cos(latRad) || 1);
    ring.push([lng, lat]);
  }
  return ring;
}

export function lerpAngle(from: number, to: number, t: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta * t;
}

export type Approach = 'towards' | 'away' | 'passing';

/** Metres the gap must change before we call a bus towards you or away. */
export const APPROACH_DELTA_M = 25;
export const REACH_MAX_M = 3_000;
export const MOVING_SPEED_MPS = 1;

/** Compare the oldest and newest distances from the rider. A shorter gap means the bus is coming closer. */
export function approachFromDistances(samples: number[]): Approach | null {
  if (samples.length < 2) return null;
  const delta = samples[samples.length - 1] - samples[0];
  if (delta <= -APPROACH_DELTA_M) return 'towards';
  if (delta >= APPROACH_DELTA_M) return 'away';
  return 'passing';
}

export function approachLabel(approach: Approach): string {
  if (approach === 'towards') return 'Coming towards you';
  if (approach === 'away') return 'Moving away';
  return 'Passing nearby';
}

export function formatDistance(metres: number): string {
  const rounded = Math.max(0, Math.round(metres));
  if (rounded < 1000) return `${rounded} m from you`;
  const km = rounded / 1000;
  const text = km >= 10 ? String(Math.round(km)) : (Math.round(km * 10) / 10).toFixed(1);
  return `${text} km from you`;
}

/** Straight-line guess, only while the bus is closing the gap and is still nearby. */
export function reachMinutes(distanceM: number, speedMps: number | null, approach: Approach | null): number | null {
  if (approach !== 'towards') return null;
  if (distanceM > REACH_MAX_M) return null;
  if (speedMps == null || speedMps < MOVING_SPEED_MPS) return null;
  return Math.max(1, Math.round(distanceM / speedMps / 60));
}

export function formatReach(minutes: number): string {
  return `Could reach you in ~${minutes} min`;
}

export function formatSpeed(speedMps: number | null): string {
  if (speedMps == null || speedMps < MOVING_SPEED_MPS) return 'Stopped';
  return `Moving · ${Math.round(speedMps * 3.6)} km/h`;
}

export function formatUpdated(recordedAt: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - recordedAt) / 1000));
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Updated ${minutes} min ago`;
}

export function formatAgo(recordedAt: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - recordedAt) / 1000));
  if (seconds < 45) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}
