CREATE TABLE IF NOT EXISTS payment_collections (
  id UUID PRIMARY KEY,
  rider_id TEXT NOT NULL REFERENCES users(id),
  request_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount_ngwee INTEGER NOT NULL CHECK (amount_ngwee > 0),
  currency TEXT NOT NULL CHECK (currency = 'ZMW'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rider_id, request_key),
  UNIQUE (id, provider, merchant, amount_ngwee, currency),
  UNIQUE (id, provider, merchant)
);

-- One row represents a balanced debit and credit for the same amount.
-- The debit is partner clearing and the credit is the liability to the rider
-- identified by the associated collection.
CREATE TABLE IF NOT EXISTS payment_collection_postings (
  collection_id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  merchant TEXT NOT NULL,
  provider_transaction TEXT NOT NULL,
  amount_ngwee INTEGER NOT NULL,
  currency TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (collection_id, provider, merchant, amount_ngwee, currency)
    REFERENCES payment_collections(id, provider, merchant, amount_ngwee, currency),
  UNIQUE (provider, merchant, provider_transaction),
  UNIQUE (collection_id, provider, merchant, provider_transaction)
);

CREATE TABLE IF NOT EXISTS payment_collection_confirmations (
  provider TEXT NOT NULL,
  merchant TEXT NOT NULL,
  event_id TEXT NOT NULL,
  collection_id UUID NOT NULL,
  provider_transaction TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, merchant, event_id),
  FOREIGN KEY (collection_id, provider, merchant, provider_transaction)
    REFERENCES payment_collection_postings(collection_id, provider, merchant, provider_transaction)
);

CREATE OR REPLACE FUNCTION deny_collection_posting_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Confirmed payment records are append-only';
END;
$$;

DROP TRIGGER IF EXISTS payment_posting_append_only ON payment_collection_postings;
CREATE TRIGGER payment_posting_append_only BEFORE UPDATE OR DELETE ON payment_collection_postings
  FOR EACH ROW EXECUTE FUNCTION deny_collection_posting_change();

DROP TRIGGER IF EXISTS payment_confirmation_append_only ON payment_collection_confirmations;
CREATE TRIGGER payment_confirmation_append_only BEFORE UPDATE OR DELETE ON payment_collection_confirmations
  FOR EACH ROW EXECUTE FUNCTION deny_collection_posting_change();
