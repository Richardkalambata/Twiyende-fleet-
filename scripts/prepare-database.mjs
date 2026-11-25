import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { SCHEMA_SQL } from '../lib/schema.ts';

const url = process.env.TWENDE_MIGRATION_DATABASE_URL;
if (!url) throw new Error('Set TWENDE_MIGRATION_DATABASE_URL for the migration role.');
const parsed = new URL(url);
const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
const modes = parsed.searchParams.getAll('sslmode');
if (!local && (modes.length !== 1 || modes[0] !== 'verify-full' || parsed.searchParams.has('uselibpqcompat'))) {
  throw new Error('Remote schema migrations require sslmode=verify-full.');
}
const ledger = await readFile(new URL('../migrations/003_collection_ledger.sql', import.meta.url), 'utf8');
const client = new Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query('SELECT pg_advisory_xact_lock(872341)');
  await client.query(SCHEMA_SQL);
  await client.query(ledger);
  await client.query('COMMIT');
  console.log('Twende schema is ready.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await client.end();
}
