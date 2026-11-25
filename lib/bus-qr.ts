import { riderPaymentPath } from './codes';

export const DEFAULT_FARE_ORIGIN = 'https://twende-fleet-refresh.richardkalambata495.workers.dev';

const knownOrigins = new Set([
  DEFAULT_FARE_ORIGIN,
  'https://twende-fleet-refresh.vercel.app',
  'https://twende-zm.vercel.app',
]);

export function scannedBusNumber(value: string, currentOrigin: string, publicOrigin?: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.hash) return null;
  if (url.origin !== currentOrigin && url.origin !== publicOrigin && !knownOrigins.has(url.origin)) return null;
  if (url.pathname !== '/pay' && url.pathname !== '/login' && url.pathname !== '/home') return null;
  const buses = url.searchParams.getAll('bus');
  return buses.length === 1 && riderPaymentPath(buses[0]) ? (buses[0] ?? null) : null;
}
