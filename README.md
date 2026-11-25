# Twende

Two products in one Next.js app. **Twende** is the rider app at `/`. **Twende Fleet Business** is the operator and conductor app at `/business`.

This is a working demo with Postgres, not a static mock. Sample buses, conductors and balances are **demo data**.

## Apps

**Twende (riders)** — `/`

- One-page welcome at `/` (and `/welcome`), then sign up and sign in
- `/home` wallet, pay a fare, recent trips, popular routes
- `/rides` trip history, `/receipt/[id]` one-time code
- `/topup` simulated MTN, Airtel or Zamtel
- `/lost` report and track items, `/profile`

**Twende Fleet Business** — `/business`

- Landing, `/business/signup`, `/business/login`
- Operator desk `/business/desk`: overview, buses, conductors, assignments, routes and fares, payouts, lost & found, settings
- Conductor app `/business/drive`: verify codes for today’s assigned bus, trips, lost & found

A rider cannot sign in on the business app, and an operator or conductor cannot sign in on the rider app. Old `/fleet` and `/conductor` addresses redirect into Business.

## What you can do

- **Passenger** — top up a wallet (simulated mobile money), pay a fare for a bus fleet number, and show a 4-character code.
- **Conductor** — see the bus assigned for today, then type that code. Twende checks that it exists, belongs to that bus, and has not been used.
- **Operator** — Kalambata Transport’s desk: today’s takings, buses, conductors, shift assignments, payouts and the lost-and-found queue.
- **Lost & found** — a passenger reports an item from a past trip (photo optional). The conductor can mark it found or log something left on the bus. A match creates a pickup code. The conductor or operator types that code to close it. The passenger can leave an optional tip.

Codes use letters and digits without `0`, `O`, `1` or `I`, so they are easier to read on a moving bus.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres via `pg`, using the pooled `DATABASE_URL` for queries and `DATABASE_URL_UNPOOLED` for seeding when it is set
- On Vercel, `@vercel/functions` attaches the pool so Fluid Compute can reuse it

Node.js 22 or newer is required. Do not commit a real `DATABASE_URL`.

## Setup

Create a local database, then:

```bash
cp .env.example .env.local
# set DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:5432/twende
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first request creates the tables and loads demo data for the current Lusaka day. A second instance waits on a Postgres advisory lock, so seeding does not run twice. Sessions, fares, and photos live in Postgres.

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` always uses the local `twende_unit` database and refuses a remote `DATABASE_URL`. End-to-end tests and `npx tsx tests/capture.ts` use only the local `twende_e2e` database on `127.0.0.1:3050`. They refuse a remote URL, the live site, and the demo databases `twende` and `twende_test`.

## Vercel

Set `DATABASE_URL` to the Neon pooled URL and `DATABASE_URL_UNPOOLED` to the direct URL. Deploy the Node.js runtime (not Edge). The app reads those variables at request time and does not need a SQLite file.

## Cloudflare Workers

Build with `npm run build:cloudflare` and deploy with `npm run deploy:cloudflare`.
Set `DATABASE_URL` as a Worker runtime secret using the existing Neon pooled
connection string with TLS enabled. Set the same runtime payment and sign-in
options used by the Vercel release. The Worker expects the existing schema and
does not create or seed the database on first request.

Check the rider, conductor and operator flows on the Worker URL before switching
traffic. Set `TWENDE_PUBLIC_ORIGIN` to the public rider URL that should appear in
new bus QR codes.

## Demo accounts

Every demo PIN is **123456**. The sign-in screen can also open these accounts in one tap. One-tap access requires `DEMO_ROLE_SWITCHER=1`. Enable it only on an isolated demo database.

| Role | Name | Phone | Notes |
| --- | --- | --- | --- |
| Passenger | Richard Banda | 0971 000 001 | Wallet starts at K120 |
| Conductor | Mwila Zulu | 0962 000 012 | Bus 12, Town to Matero |
| Conductor | Chanda Mulenga | 0962 000 015 | Bus 15, Town to Chilenje |
| Conductor | Bwalya Mwamba | 0962 000 021 | Bus 21, Town to Kalingalinga |
| Conductor | Phiri Daka | 0962 000 034 | Bus 34, Town to Chelston |
| Passenger | Namwinga Phiri | 0972 000 002 | Has an open lost-phone report on Bus 12 |
| Operator | Richard Kalambata | 0977 000 001 | Kalambata Transport, at `/business` |

The rider profile only lists other riders. Business settings lists the operator and conductors. Set `DEMO_ROLE_SWITCHER=0` to hide both. The fleet overview is labelled **Demo data**.

## Demo the two apps

1. Open `/` and walk through onboarding, or go to `/login` and sign in as **Richard** (passenger). Home shows K120, bus 12 and a fare of K5.
2. Enter bus **12**, leave the fare at **5**, and tap **Pay K5**. The receipt shows a 4-character code and the new balance, K115.
3. Open `/business/login` and sign in as **Mwila** (phone 0962 000 012, PIN 123456). Mwila is assigned to bus 12 today.
4. On **Verify**, type the code and tap **Verify**. The fare shows as paid and the code is now used. Entering it again says it was already used. A code for bus 12 is rejected on Chanda’s bus 15.
5. Sign in as **Richard Kalambata** at `/business/login`. Overview totals include the new fare. **Assignments** shows who is on which bus today. **Buses** and **Conductors** can register a new fleet number and a conductor.

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

**Settings → Reset demo data** on the operator account restores the sample fleet, Richard’s K120, today’s assignments, and the lost-and-found queue. The dataset also rebuilds itself when the Lusaka date changes, so “today” stays populated.


### Operator sign-in verification

Production operator sign-in requires a six-digit PIN and SMS verification. Configure `TWILIO_VERIFY_SERVICE_SID`, `TWILIO_API_KEY`, and `TWILIO_API_SECRET` on the server and enable six-digit Verify codes for Zambia. Set `OPERATOR_SMS_REQUIRED=1` to test this in the demo environment. Production self-registration stays closed until rider phone verification and operator approval are implemented.

## Payment architecture staging

Prepare a disposable PostgreSQL database with `npm run db:prepare` using
`TWENDE_MIGRATION_DATABASE_URL` for the migration role. Remote migration
connections require `sslmode=verify-full`. This command applies the app
schema and collection journal without seeding demo users.

The collection journal records one debit to partner clearing and one credit
to the rider liability for each confirmed collection. Its confirmation
handler is an internal service. Connect it only to a partner adapter that
verifies the signed event or fetches authoritative transaction status,
including the merchant, reference, amount, and currency. The simulated
wallet and existing app routes remain independent of the journal. A
provider adapter, reconciliation, refunds, and payouts are still needed
for a real-money pilot.


## Standalone app and low-data testing

Use `docker build -t twende .` for the standalone Next.js runtime. Deploy
behind an HTTPS load balancer and point its readiness check at
`/api/health`. Inject the runtime database credentials from a secret store
and use a restricted role with `sslmode=verify-full`. Run schema preparation
separately with the migration role. Production rejects simulated transfers,
demo sign-ins, and runtime demo initialization.

Use a separate database for test builds. Prepare it ahead of time and use
`TWENDE_ENV=demo` for simulation. The current Cloudflare configuration
is a demo configuration. Users need to sign in again upon switching to
the release that separates rider, conductor, and operator sessions.

The fare screen retrieves the selected bus. The live map and its network
requests start after the user chooses to open it. Run the Playwright
`fare-foundation.spec.ts` test against the isolated local fixture database.
