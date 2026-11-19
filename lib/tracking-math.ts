import type { GeoPoint } from './lusaka-routes';

export const STALE_MS = 3 * 60 * 1000;
export const MOVE_METRES = 15;
export const SEND_GAP_MS = 30 * 1000;
export const FALLBACK_SPEED_MPS = 8;

export function isStale(recordedAt: number, now: number): boolean {
  return now - recordedAt > STALE_MS;
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

export function pointAtDistance(points: GeoPoint[], metres: number): GeoPoint & { heading: number } {
  if (points.length === 0) return { lat: -15.4167, lng: 28.2817, heading: 0 };
  if (points.length === 1) return { ...points[0], heading: 0 };
  const totals = cumulative(points);
  const length = totals[totals.length - 1] || 1;
  const distance = ((metres % length) + length) % length;
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

function distanceAlong(points: GeoPoint[], point: GeoPoint): number {
  return projectOnto(points, point).along;
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

export function etaMinutes(route: GeoPoint[], bus: GeoPoint, stop: GeoPoint, speedMps: number | null): number {
  if (route.length < 2) {
    const speed = speedMps && speedMps > 1 ? speedMps : FALLBACK_SPEED_MPS;
    return Math.max(1, Math.round(haversineMetres(bus, stop) / speed / 60));
  }
  const totals = cumulative(route);
  const length = totals[totals.length - 1] || 1;
  const busAlong = distanceAlong(route, bus);
  let stopAlong = distanceAlong(route, stop);
  if (stopAlong + 20 < busAlong) stopAlong += length;
  const metres = Math.max(0, stopAlong - busAlong);
  const speed = speedMps && speedMps > 1 ? speedMps : FALLBACK_SPEED_MPS;
  return Math.max(1, Math.round(metres / speed / 60));
}

export function formatEta(minutes: number): string {
  return `~${minutes} min`;
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
