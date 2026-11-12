# Twende

Cashless minibus fares for Lusaka. A passenger pays from a phone wallet, the conductor confirms a short one-time code, and the owner sees every fare.

This is a working demo with a real database, not a static mock. Sample buses, conductors and balances are **demo data**.

## What you can do

- **Passenger** — top up a wallet (simulated mobile money), pay a fare for a bus fleet number, and show a 4-character code.
- **Conductor** — type that code. Twende checks that it exists, belongs to their bus, and has not been used, then marks it used.
- **Owner** — Richard Kalambata’s fleet dashboard: today, week and month totals, an earnings chart, buses, conductors, payouts and the lost-and-found queue.
- **Lost & found** — a passenger reports an item from a past trip (photo optional). The conductor can mark it found or log something left on the bus. A match creates a pickup code. The conductor or owner types that code to close it. The passenger can leave an optional tip.

Codes use letters and digits without `0`, `O`, `1` or `I`, so they are easier to read on a moving bus.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via Node’s built-in `node:sqlite` (no database account, no secrets)
- The SQL is ordinary and lives behind `lib/db.ts`, so a Postgres driver can replace that file later for Vercel

Node.js 22 or newer is required.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database file is created at `data/twende.sqlite` on first launch and filled with demo data for the current Lusaka day. Nothing in this repo is a credential. See `.env.example` for optional settings.

```bash
npm test        # fare, verify, lost-and-found and dashboard totals
npm run typecheck
npm run lint
npm run build
```

## Demo accounts

Every demo PIN is **1234**. The sign-in screen can also open these accounts in one tap. Set `DEMO_ROLE_SWITCHER=0` before any real deployment to turn that off.

| Role | Name | Phone | Notes |
| --- | --- | --- | --- |
| Passenger | Richard Banda | 0971 000 001 | Wallet starts at K120 |
| Conductor | Mwila Zulu | 0962 000 012 | Bus 12, Town to Matero |
| Conductor | Chanda Mulenga | 0962 000 015 | Bus 15, Town to Chilenje |
| Conductor | Bwalya Mwamba | 0962 000 021 | Bus 21, Town to Kalingalinga |
| Conductor | Phiri Daka | 0962 000 034 | Bus 34, Town to Chelston |
| Passenger | Namwinga Phiri | 0972 000 002 | Has an open lost-phone report on Bus 12 |
| Owner | Richard Kalambata | 0977 000 001 | Fleet dashboard |

Profile and Settings include a **demo role switcher**. The fleet overview is labelled **Demo data**.

## Demo the three roles

1. Sign in as **Richard** (passenger). Home shows K120, bus 12 and a fare of K5.
2. Enter bus **12**, leave the fare at **5**, and tap **Pay K5**. The receipt shows a 4-character code and the new balance, K115.
3. Open **Profile** and switch to **Mwila**, or sign out and use Mwila’s phone and PIN.
4. On **Verify**, type the code and tap **Verify**. The fare shows as paid and the code is now used. Entering it again says it was already used. A code for bus 12 is rejected on Chanda’s bus 15.
5. Switch to **Richard Kalambata**. Overview totals include the new fare. **Today / Week / Month** and **Export** use the same ledger. **Buses** and **Conductors** can register a new fleet number and assign a conductor.

Wrong bus, before the conductor verifies: the passenger can cancel the fare from the receipt and the wallet is refunded.

## Demo lost & found

1. As Richard, open the found-phone card (pickup code **P9X2** on the seeded report) or report a new item from **Lost & found**. A photo is optional. SMS is recorded, not sent.
2. As Mwila, open **Lost & found**. Namwinga’s phone report can be marked **Found it** or **Not found**. Logging a found item stores it on the bus and matches an open report of the same kind.
3. When an item is found, Richard’s screen shows a pickup code, the stop (Town bus stage, Bay 4), directions, a call button, and optional tips of K5, K10 or K20.
4. Mwila or the owner types that pickup code to close the handover. The code is not shown on their screens.

## Money

Top-ups and payouts call `PaymentProvider` in `lib/payments`. The default `SimulatedPaymentProvider` always succeeds and never calls MTN, Airtel or Zamtel. Replace it with an aggregator adapter and select it from `getPaymentProvider()` when you have credentials. Keep those credentials out of the repo.

Fares move from the passenger wallet to the owner’s verified takings. Tips move from the passenger wallet to the conductor. No Twende fee is deducted; pricing is still undecided.

## Reset

**Settings → Reset demo data** on the owner account restores the sample fleet, Richard’s K120, and the lost-and-found queue. The dataset also rebuilds itself when the Lusaka date changes, so “today” stays populated.
