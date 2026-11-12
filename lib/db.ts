import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema';
import { rebuild, seedKey } from './seed';

const globalForDb = globalThis as unknown as {
  twendeDb?: DatabaseSync;
  twendeSeedKey?: string;
};

function databasePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'twende.sqlite');
}

function openDatabase(): DatabaseSync {
  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 3000');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  return db;
}

function ensureSeed(db: DatabaseSync) {
  const key = seedKey();
  if (globalForDb.twendeSeedKey === key) return;
  const row = db.prepare(`SELECT value FROM meta WHERE key = 'seeded_for'`).get() as { value?: string } | undefined;
  if (row?.value === key) {
    globalForDb.twendeSeedKey = key;
    return;
  }
  rebuild(db);
  globalForDb.twendeSeedKey = key;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.twendeDb) globalForDb.twendeDb = openDatabase();
  ensureSeed(globalForDb.twendeDb);
  return globalForDb.twendeDb;
}

export function resetDatabase() {
  const db = getDb();
  globalForDb.twendeSeedKey = undefined;
  rebuild(db);
  globalForDb.twendeSeedKey = seedKey();
}
