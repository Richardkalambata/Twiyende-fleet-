const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const DEMO_DATABASES = new Set(['twende', 'twende_test', 'neondb']);
const E2E_DATABASE = 'twende_e2e';

export const E2E_DATABASE_URL = 'postgres://twende:twende@127.0.0.1:5432/twende_e2e';
export const E2E_BASE_URL = 'http://127.0.0.1:3050';

function databaseName(url: URL): string {
  return decodeURIComponent(url.pathname.replace(/^\//, '').split('/')[0] ?? '');
}

/** Refuse e2e and capture when the URL is remote or is a demo/production database. */
export function assertSafeDatabase(url: string | undefined, kind: 'e2e' | 'capture'): void {
  if (!url) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Refusing to run ${kind}: DATABASE_URL is not a valid URL.`);
  }
  const host = parsed.hostname;
  const name = databaseName(parsed);
  const local = LOCAL_HOSTS.has(host);
  if (!local || DEMO_DATABASES.has(name)) {
    throw new Error(`Refusing to run ${kind}: DATABASE_URL points at the production database (${name || host}). Use the local ${E2E_DATABASE} database.`);
  }
  if (name !== E2E_DATABASE) {
    throw new Error(`Refusing to run ${kind}: DATABASE_URL must be the local ${E2E_DATABASE} database.`);
  }
}

/** Refuse a capture or e2e run aimed at the live site. */
export function assertLocalServer(baseUrl: string | undefined, kind: 'e2e' | 'capture'): void {
  if (!baseUrl) return;
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Refusing to run ${kind}: the server URL is not valid.`);
  }
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(`Refusing to run ${kind}: ${parsed.hostname} is not a local server.`);
  }
  const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  if (port !== '3050') {
    throw new Error(`Refusing to run ${kind}: use ${E2E_BASE_URL}, which serves the local ${E2E_DATABASE} database.`);
  }
}
