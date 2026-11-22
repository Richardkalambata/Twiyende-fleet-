/** Postgres schema. Timestamps are unix milliseconds (BIGINT) so Lusaka day math stays exact. */

export const TRUNCATE_SQL = `
TRUNCATE TABLE
  bus_locations,
  bus_latest,
  shifts,
  code_leases,
  stops,
  sms_messages,
  conductor_payouts,
  payouts,
  lost_items,
  wallet_transactions,
  rides,
  assignments,
  route_fares,
  notifications,
  support_messages,
  support_tickets,
  operator_verifications,
  login_limits,
  sessions,
  wallets,
  buses,
  companies,
  users,
  meta
RESTART IDENTITY CASCADE
`;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('passenger', 'conductor', 'operator', 'owner')),
  initials TEXT NOT NULL,
  demo BOOLEAN NOT NULL DEFAULT FALSE,
  payout_phone TEXT,
  payout_network TEXT,
  created_at BIGINT NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS conductor_closes_at BIGINT;

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users (id),
  balance_ngwee INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  expires_at BIGINT NOT NULL
);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS operator_verified BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS login_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS operator_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider_sid TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  next_hash TEXT,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  fleet_number TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  route TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'offline')),
  owner_id TEXT NOT NULL REFERENCES users (id),
  conductor_id TEXT REFERENCES users (id),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL REFERENCES users (id),
  passenger_label TEXT NOT NULL,
  bus_id TEXT NOT NULL REFERENCES buses (id),
  conductor_id TEXT REFERENCES users (id),
  amount_ngwee INTEGER NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'void')),
  created_at BIGINT NOT NULL,
  verified_at BIGINT,
  route_snapshot TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  type TEXT NOT NULL,
  amount_ngwee INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  provider TEXT,
  provider_ref TEXT,
  ride_id TEXT REFERENCES rides (id),
  lost_item_id TEXT,
  note TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS lost_items (
  id TEXT PRIMARY KEY,
  ride_id TEXT REFERENCES rides (id),
  passenger_id TEXT REFERENCES users (id),
  bus_id TEXT NOT NULL REFERENCES buses (id),
  conductor_id TEXT REFERENCES users (id),
  owner_id TEXT NOT NULL REFERENCES users (id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_data TEXT,
  notify_sms BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('reported', 'waiting', 'not_found', 'pickup_pending', 'closed')),
  pickup_code TEXT,
  pickup_place TEXT,
  pickup_until BIGINT,
  source TEXT NOT NULL CHECK (source IN ('passenger', 'conductor')),
  found_by TEXT REFERENCES users (id),
  found_at BIGINT,
  closed_at BIGINT,
  created_at BIGINT NOT NULL,
  tip_ngwee INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  lost_item_id TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS code_leases (
  code TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  reusable_at BIGINT
);
CREATE INDEX IF NOT EXISTS idx_rides_code ON rides (code);
CREATE INDEX IF NOT EXISTS idx_lost_items_pickup_code ON lost_items (pickup_code);
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_code_key;
ALTER TABLE lost_items DROP CONSTRAINT IF EXISTS lost_items_pickup_code_key;

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  amount_ngwee INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'paid', 'failed')),
  network TEXT NOT NULL,
  destination TEXT NOT NULL,
  provider_ref TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS conductor_payouts (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL REFERENCES users (id),
  conductor_id TEXT NOT NULL REFERENCES users (id),
  amount_ngwee INTEGER NOT NULL CHECK (amount_ngwee > 0),
  paid_on TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
ALTER TABLE conductor_payouts ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE conductor_payouts ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE conductor_payouts ADD COLUMN IF NOT EXISTS transfer_reference TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conductor_payout_reference
  ON conductor_payouts (operator_id, network, transfer_reference) WHERE transfer_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conductor_payout_history
  ON conductor_payouts (conductor_id, paid_on DESC, created_at DESC);

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS operator_id TEXT;

ALTER TABLE buses ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 18;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS default_fare_ngwee INTEGER NOT NULL DEFAULT 500;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE buses ALTER COLUMN route DROP NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('passenger', 'conductor', 'operator', 'owner'));

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  operator_id TEXT NOT NULL REFERENCES users (id),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  conductor_id TEXT NOT NULL REFERENCES users (id),
  bus_id TEXT NOT NULL REFERENCES buses (id),
  shift_date TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE (conductor_id, shift_date),
  UNIQUE (bus_id, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments (shift_date, bus_id);

ALTER TABLE rides ADD COLUMN IF NOT EXISTS expires_at BIGINT;

CREATE TABLE IF NOT EXISTS route_fares (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  route TEXT NOT NULL,
  amount_ngwee INTEGER NOT NULL,
  UNIQUE (owner_id, route, amount_ngwee)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT NOT NULL,
  read_at BIGINT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  conductor_id TEXT NOT NULL REFERENCES users (id),
  bus_id TEXT NOT NULL REFERENCES buses (id),
  started_at BIGINT NOT NULL,
  ended_at BIGINT,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shifts_bus ON shifts (bus_id, ended_at);

CREATE TABLE IF NOT EXISTS bus_locations (
  id TEXT PRIMARY KEY,
  bus_id TEXT NOT NULL REFERENCES buses (id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  recorded_at BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('conductor', 'simulated'))
);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_time ON bus_locations (bus_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS bus_latest (
  bus_id TEXT PRIMARY KEY REFERENCES buses (id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  recorded_at BIGINT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  seq INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stops_route ON stops (route, seq);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  user_id TEXT NOT NULL REFERENCES users (id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets (id),
  author_id TEXT NOT NULL REFERENCES users (id),
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

INSERT INTO wallet_transactions (id, user_id, type, amount_ngwee, balance_after, provider, provider_ref, ride_id, lost_item_id, note, created_at)
SELECT 'wtx_backfill_' || user_id, user_id, 'opening', balance_ngwee, balance_ngwee, 'ledger', NULL, NULL, NULL, 'Opening balance', 0
FROM wallets w
WHERE balance_ngwee <> 0
AND NOT EXISTS (SELECT 1 FROM wallet_transactions t WHERE t.user_id = w.user_id);
`;
