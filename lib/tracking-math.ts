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

export function pointAlong(points: GeoPoint[], fraction: number): GeoPoint & { heading: number } {
  if (points.length === 0) return { lat: -15.4167, lng: 28.2817, heading: 0 };
  if (points.length === 1) return { ...points[0], heading: 0 };
  const totals = cumulative(points);
  const length = totals[totals.length - 1] || 1;
  const distance = Math.min(length, Math.max(0, fraction)) * length;
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

function distanceAlong(points: GeoPoint[], point: GeoPoint): number {
  if (points.length < 2) return 0;
  let best = 0;
  let bestGap = Infinity;
  const totals = cumulative(points);
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const abLat = b.lat - a.lat;
    const abLng = b.lng - a.lng;
    const denom = abLat * abLat + abLng * abLng || 1;
    const t = Math.min(1, Math.max(0, ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / denom));
    const projected = { lat: a.lat + abLat * t, lng: a.lng + abLng * t };
    const gap = haversineMetres(point, projected);
    if (gap < bestGap) {
      bestGap = gap;
      best = totals[index - 1] + haversineMetres(a, projected);
    }
  }
  return best;
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

export function formatAgo(recordedAt: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - recordedAt) / 1000));
  if (seconds < 45) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}
