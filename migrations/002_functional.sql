-- Functional tables. Applied automatically by the app on startup (lib/schema.ts).
-- Kept here so the migration is versioned.

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
