export const DROP_SQL = `
DROP TABLE IF EXISTS sms_messages;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS lost_items;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS meta;
`;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('passenger', 'conductor', 'owner')),
  initials TEXT NOT NULL,
  demo INTEGER NOT NULL DEFAULT 0,
  payout_phone TEXT,
  payout_network TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  balance_ngwee INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  fleet_number TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  route TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'offline')),
  owner_id TEXT NOT NULL REFERENCES users(id),
  conductor_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL REFERENCES users(id),
  passenger_label TEXT NOT NULL,
  bus_id TEXT NOT NULL REFERENCES buses(id),
  conductor_id TEXT REFERENCES users(id),
  amount_ngwee INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'void')),
  created_at INTEGER NOT NULL,
  verified_at INTEGER,
  route_snapshot TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  amount_ngwee INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  provider TEXT,
  provider_ref TEXT,
  ride_id TEXT REFERENCES rides(id),
  lost_item_id TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lost_items (
  id TEXT PRIMARY KEY,
  ride_id TEXT REFERENCES rides(id),
  passenger_id TEXT REFERENCES users(id),
  bus_id TEXT NOT NULL REFERENCES buses(id),
  conductor_id TEXT REFERENCES users(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_data TEXT,
  notify_sms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('reported', 'waiting', 'not_found', 'pickup_pending', 'closed')),
  pickup_code TEXT UNIQUE,
  pickup_place TEXT,
  pickup_until INTEGER,
  source TEXT NOT NULL CHECK (source IN ('passenger', 'conductor')),
  found_by TEXT REFERENCES users(id),
  found_at INTEGER,
  closed_at INTEGER,
  created_at INTEGER NOT NULL,
  tip_ngwee INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  lost_item_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  amount_ngwee INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'paid', 'failed')),
  network TEXT NOT NULL,
  destination TEXT NOT NULL,
  provider_ref TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rides_bus_time ON rides (bus_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides (passenger_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides (created_at);
CREATE INDEX IF NOT EXISTS idx_lost_bus_status ON lost_items (bus_id, status);
CREATE INDEX IF NOT EXISTS idx_lost_passenger ON lost_items (passenger_id, created_at);
CREATE INDEX IF NOT EXISTS idx_buses_owner ON buses (owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
`;
