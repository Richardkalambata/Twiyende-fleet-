import { randomUUID } from 'node:crypto';
import { getDb, withTransaction } from '../db';

type Collection = {
  id: string;
  rider_id: string;
  provider: string;
  merchant: string;
  amount_ngwee: number;
  currency: string;
};
type Confirmation = {
  collectionId: string;
  provider: string;
  merchant: string;
  transactionId: string;
  eventId: string;
  amountNgwee: number;
  currency: string;
};
type Posting = { provider_transaction: string };

export class CollectionConflict extends Error {}

function validateReference(value: string) {
  if (!value || value.length > 128 || !/^[\x21-\x7E]+$/.test(value)) {
    throw new CollectionConflict('Invalid payment reference.');
  }
}

function validateAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 2_147_483_647) {
    throw new CollectionConflict('Invalid payment amount.');
  }
}

export async function startCollection(input: {
  riderId: string;
  requestKey: string;
  provider: string;
  merchant: string;
  amountNgwee: number;
}): Promise<Collection> {
  validateAmount(input.amountNgwee);
  validateReference(input.requestKey);
  validateReference(input.provider);
  validateReference(input.merchant);

  const db = await getDb();
  const created = await db.get<Collection>(`INSERT INTO payment_collections
    (id, rider_id, request_key, provider, merchant, amount_ngwee, currency)
    SELECT ?, id, ?, ?, ?, ?, 'ZMW' FROM users WHERE id = ? AND role = 'passenger'
    ON CONFLICT (rider_id, request_key) DO NOTHING
    RETURNING id, rider_id, provider, merchant, amount_ngwee, currency`,
  randomUUID(), input.requestKey, input.provider, input.merchant, input.amountNgwee, input.riderId);
  if (created) return created;

  const prior = await db.get<Collection>(`SELECT id, rider_id, provider, merchant, amount_ngwee, currency
    FROM payment_collections WHERE rider_id = ? AND request_key = ?`, input.riderId, input.requestKey);
  if (!prior || prior.provider !== input.provider || prior.merchant !== input.merchant || prior.amount_ngwee !== input.amountNgwee) {
    throw new CollectionConflict('The payment request does not match.');
  }
  return prior;
}

/** Internal only. A live adapter must authenticate and verify the partner's result before calling this. */
export async function recordVerifiedCollection(event: Confirmation): Promise<'posted' | 'already-posted'> {
  validateAmount(event.amountNgwee);
  validateReference(event.provider);
  validateReference(event.merchant);
  validateReference(event.eventId);
  validateReference(event.transactionId);
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(event.collectionId)) {
    throw new CollectionConflict('Invalid collection reference.');
  }

  return withTransaction(async () => {
    const db = await getDb();
    const intent = await db.get<Collection>('SELECT * FROM payment_collections WHERE id = ? FOR UPDATE', event.collectionId);
    if (!intent || intent.provider !== event.provider || intent.merchant !== event.merchant
      || intent.amount_ngwee !== event.amountNgwee || intent.currency !== event.currency) {
      throw new CollectionConflict('The confirmation does not match the collection.');
    }

    const prior = await db.get<Posting>('SELECT provider_transaction FROM payment_collection_postings WHERE collection_id = ?', intent.id);
    if (prior && prior.provider_transaction !== event.transactionId) {
      throw new CollectionConflict('This collection has a different confirmed transaction.');
    }
    if (!prior) {
      const inserted = await db.run(`INSERT INTO payment_collection_postings
        (collection_id, provider, merchant, provider_transaction, amount_ngwee, currency)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
      intent.id, intent.provider, intent.merchant, event.transactionId, intent.amount_ngwee, intent.currency);
      if (!inserted.changes) throw new CollectionConflict('The provider transaction is already in use.');
    }
    const recorded = await db.run(`INSERT INTO payment_collection_confirmations
      (provider, merchant, event_id, collection_id, provider_transaction)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
    intent.provider, intent.merchant, event.eventId, intent.id, event.transactionId);
    if (!recorded.changes) {
      const sameEvent = await db.get(`SELECT 1 FROM payment_collection_confirmations
        WHERE provider = ? AND merchant = ? AND event_id = ? AND collection_id = ? AND provider_transaction = ?`,
      intent.provider, intent.merchant, event.eventId, intent.id, event.transactionId);
      if (!sameEvent) throw new CollectionConflict('The provider event is already in use.');
    }
    return prior ? 'already-posted' : 'posted';
  });
}
