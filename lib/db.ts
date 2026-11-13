import { AsyncLocalStorage } from 'node:async_hooks';
import { attachDatabasePool } from '@vercel/functions';
import { Client, Pool, type PoolClient, type QueryResult, types as pgTypes } from 'pg';
import { SCHEMA_SQL, TRUNCATE_SQL } from './schema';
import { seed, seedKey } from './seed';

/** Advisory lock key for demo seeding. Held only for the seed transaction. */
const SEED_LOCK = 872341;

// BIGINT comes back as a string by default. Fares and timestamps are numbers.
pgTypes.setTypeParser(20, (value) => Number(value));

export type Db = {
  get<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  all<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  run(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  exec(sql: string): Promise<void>;
};

type Queryable = {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
};

const txStorage = new AsyncLocalStorage<PoolClient>();

const globalForDb = globalThis as unknown as {
  twendePool?: Pool;
  twendeReady?: Promise<void> | null;
  twendeReadyKey?: string | null;
};

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add the Postgres connection string before starting Twende.');
  }
  return url;
}

function directUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED || databaseUrl();
}

function sslFor(url: string): { rejectUnauthorized: false } | undefined {
  if (/localhost|127\.0\.0\.1/.test(url)) return undefined;
  return { rejectUnauthorized: false };
}

function getPool(): Pool {
  if (!globalForDb.twendePool) {
    const pool = new Pool({
      connectionString: databaseUrl(),
      max: 5,
      idleTimeoutMillis: 10_000,
      ssl: sslFor(databaseUrl()),
    });
    attachDatabasePool(pool);
    globalForDb.twendePool = pool;
  }
  return globalForDb.twendePool;
}

function toPg(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function wrap(client: Queryable): Db {
  return {
    async get<T>(sql: string, ...params: unknown[]): Promise<T | null> {
      const result = await client.query(toPg(sql), params);
      return (result.rows[0] as T | undefined) ?? null;
    },
    async all<T>(sql: string, ...params: unknown[]): Promise<T[]> {
      const result = await client.query(toPg(sql), params);
      return result.rows as T[];
    },
    async run(sql: string, ...params: unknown[]): Promise<{ changes: number }> {
      const result = await client.query(toPg(sql), params);
      return { changes: result.rowCount ?? 0 };
    },
    async exec(sql: string): Promise<void> {
      await client.query(sql);
    },
  };
}

async function seedIfNeeded(force: boolean) {
  const key = seedKey();
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
  const client = new Client({
    connectionString: directUrl(),
    ssl: sslFor(directUrl()),
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [SEED_LOCK]);
    const existing = await client.query<{ value: string }>('SELECT value FROM meta WHERE key = $1', ['seeded_for']);
    if (force || existing.rows[0]?.value !== key) {
      await client.query(TRUNCATE_SQL);
      await seed(wrap(client));
      await client.query(
        `INSERT INTO meta (key, value) VALUES ('seeded_for', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* The transaction may already be closed. */
    }
    throw error;
  } finally {
    await client.end();
  }
}

async function ensureReady() {
  const key = seedKey();
  if (globalForDb.twendeReady && globalForDb.twendeReadyKey === key) return globalForDb.twendeReady;
  globalForDb.twendeReadyKey = key;
  const pending = seedIfNeeded(false).catch((error: unknown) => {
    globalForDb.twendeReady = null;
    globalForDb.twendeReadyKey = null;
    throw error;
  });
  globalForDb.twendeReady = pending;
  return pending;
}

export async function getDb(): Promise<Db> {
  const current = txStorage.getStore();
  if (current) return wrap(current);
  await ensureReady();
  return wrap(getPool());
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await ensureReady();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await txStorage.run(client, fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* already closed */
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function resetDatabase() {
  globalForDb.twendeReady = null;
  globalForDb.twendeReadyKey = null;
  await seedIfNeeded(true);
  globalForDb.twendeReadyKey = seedKey();
  globalForDb.twendeReady = Promise.resolve();
}
