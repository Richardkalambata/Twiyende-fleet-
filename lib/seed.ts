import type { Db } from './db';
import { DEMO_PIN, IDS, PHONES, PICKUP_PLACE, SEED_VERSION } from './constants';
import { codeFromIndex } from './codes';
import { hashPin } from './pin';
import { DAY_MS, addLusakaDays, lusakaDateKey, lusakaParts, lusakaToUtc, nextPickupDeadline } from './time';

const NAMES = [
  'Chipo', 'Mutale', 'Natasha', 'Kondwani', 'Thandiwe', 'Bupe', 'Kangwa', 'Lombe', 'Twaambo', 'Mapalo',
  'Dalitso', 'Taonga', 'Wezi', 'Lubinda', 'Miyanda', 'Namakau', 'Suwilanji', 'Temwani', 'Inonge', 'Mulenga',
];

const RESERVED_CODES = new Set(['P9X2']);

type BusSeed = {
  id: string;
  fleet: string;
  plate: string;
  route: string;
  status: 'active' | 'offline';
  conductorId: string | null;
};

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], random: () => number) {
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = list[index] as T;
    list[index] = list[swap] as T;
    list[swap] = current;
  }
}

export function seedKey(now = new Date()): string {
  return `${SEED_VERSION}:${lusakaDateKey(now)}`;
}

const USER_SQL = `INSERT INTO users
    (id, name, short_name, phone, pin_hash, role, initials, demo, payout_phone, payout_network, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const WALLET_SQL = 'INSERT INTO wallets (user_id, balance_ngwee) VALUES (?, ?)';
const BUS_SQL = `INSERT INTO buses
    (id, fleet_number, plate, route, status, owner_id, conductor_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
const RIDE_SQL = `INSERT INTO rides
    (id, passenger_id, passenger_label, bus_id, conductor_id, amount_ngwee, code, status, created_at, verified_at, route_snapshot)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?)`;
const LOST_SQL = `INSERT INTO lost_items (
    id, ride_id, passenger_id, bus_id, conductor_id, owner_id, category, description, photo_data,
    notify_sms, status, pickup_code, pickup_place, pickup_until, source, found_by, found_at, closed_at, created_at, tip_ngwee
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function seed(db: Db, now = new Date()) {
  const pin = hashPin(DEMO_PIN);
  const poolPin = hashPin('9088');
  const created = now.getTime();

  const people: Array<[string, string, string, string, string, string, boolean, number, string | null, string | null]> = [
    [IDS.richard, 'Richard Banda', 'Richard', PHONES.richard, 'passenger', 'R', true, 12000, null, null],
    [IDS.owner, 'Richard Kalambata', 'Richard', PHONES.owner, 'owner', 'RK', true, 0, PHONES.owner, 'mtn'],
    [IDS.mwila, 'Mwila Zulu', 'Mwila', PHONES.mwila, 'conductor', 'MW', true, 0, null, null],
    [IDS.chanda, 'Chanda Mulenga', 'Chanda', PHONES.chanda, 'conductor', 'CM', true, 0, null, null],
    [IDS.bwalya, 'Bwalya Mwamba', 'Bwalya', PHONES.bwalya, 'conductor', 'BW', true, 0, null, null],
    [IDS.phiri, 'Phiri Daka', 'Phiri', PHONES.phiri, 'conductor', 'PD', true, 0, null, null],
    [IDS.namwinga, 'Namwinga Phiri', 'Namwinga', PHONES.namwinga, 'passenger', 'N', true, 4000, null, null],
    [IDS.pool, 'Demo riders', 'Passenger', PHONES.pool, 'passenger', 'P', false, 0, null, null],
  ];

  for (const [id, name, shortName, phone, role, initials, demo, balance, payoutPhone, payoutNetwork] of people) {
    const pinHash = id === IDS.pool ? poolPin : pin;
    await db.run(USER_SQL, id, name, shortName, phone, pinHash, role, initials, demo, payoutPhone, payoutNetwork, created);
    await db.run(WALLET_SQL, id, balance);
  }

  await db.run(`INSERT INTO wallet_transactions
    (id, user_id, type, amount_ngwee, balance_after, provider, provider_ref, ride_id, lost_item_id, note, created_at)
    VALUES (?, ?, 'opening', ?, ?, 'demo', NULL, NULL, NULL, ?, ?)`,
    'wtx_opening_richard',
    IDS.richard,
    12000,
    12000,
    'Demo opening balance',
    created - DAY_MS,
  );

  const buses: BusSeed[] = [
    { id: IDS.bus12, fleet: '12', plate: 'BLZ 12 ZA', route: 'Town to Matero', status: 'active', conductorId: IDS.mwila },
    { id: IDS.bus15, fleet: '15', plate: 'BLZ 15 ZA', route: 'Town to Chilenje', status: 'active', conductorId: IDS.chanda },
    { id: IDS.bus21, fleet: '21', plate: 'BLZ 21 ZA', route: 'Town to Kalingalinga', status: 'active', conductorId: IDS.bwalya },
    { id: IDS.bus34, fleet: '34', plate: 'BLZ 34 ZA', route: 'Town to Chelston', status: 'active', conductorId: IDS.phiri },
    { id: IDS.bus18, fleet: '18', plate: 'BLZ 18 ZA', route: 'Matero to Chawama', status: 'offline', conductorId: null },
    { id: IDS.bus8, fleet: '8', plate: 'BLZ 8 ZA', route: 'Town to Kabwata', status: 'offline', conductorId: null },
  ];
  const busById = new Map(buses.map((bus) => [bus.id, bus]));
  for (const bus of buses) {
    await db.run(BUS_SQL, bus.id, bus.fleet, bus.plate, bus.route, bus.status, IDS.owner, bus.conductorId, created);
  }

  let codeIndex = 1;
  let serial = 1;
  const nextCode = () => {
    let code = codeFromIndex(codeIndex);
    codeIndex += 1;
    while (RESERVED_CODES.has(code)) {
      code = codeFromIndex(codeIndex);
      codeIndex += 1;
    }
    return code;
  };

  const addRide = async (options: {
    id?: string;
    busId: string;
    at: number;
    passengerId?: string;
    label?: string;
  }) => {
    const bus = busById.get(options.busId);
    if (!bus) throw new Error(`Missing demo bus ${options.busId}`);
    const id = options.id ?? `ride_seed_${serial}`;
    serial += 1;
    await db.run(
      RIDE_SQL,
      id,
      options.passengerId ?? IDS.pool,
      options.label ?? NAMES[serial % NAMES.length],
      bus.id,
      bus.conductorId,
      500,
      nextCode(),
      options.at,
      options.at + 60_000,
      bus.route,
    );
  };

  const today = lusakaParts(now);
  const todayAt = (hour: number, minute: number) => lusakaToUtc(today.year, today.month, today.day, hour, minute, 0);
  const rng = mulberry32(20261112);

  await addRide({ id: 'ride_richard_today', busId: IDS.bus12, at: todayAt(7, 32), passengerId: IDS.richard, label: 'Richard' });
  await addRide({ id: 'ride_namwinga_today', busId: IDS.bus12, at: todayAt(10, 42), passengerId: IDS.namwinga, label: 'Namwinga' });

  const hours: number[] = [];
  const hourPlan: Array<[number, number]> = [
    [6, 8], [7, 17], [8, 22], [9, 20], [10, 13], [11, 12], [12, 16],
    [13, 20], [14, 28], [15, 32], [16, 22], [17, 16], [18, 12], [19, 6], [20, 3],
  ];
  for (const [hour, count] of hourPlan) {
    for (let index = 0; index < count; index += 1) hours.push(hour);
  }
  const busIds: string[] = [];
  const busPlan: Array<[string, number]> = [
    [IDS.bus12, 66],
    [IDS.bus15, 59],
    [IDS.bus21, 72],
    [IDS.bus34, 50],
  ];
  for (const [busId, count] of busPlan) {
    for (let index = 0; index < count; index += 1) busIds.push(busId);
  }
  shuffle(hours, rng);
  shuffle(busIds, rng);
  for (let index = 0; index < busIds.length; index += 1) {
    const hour = hours[index] ?? 12;
    await addRide({
      busId: busIds[index] as string,
      at: todayAt(hour, Math.floor(rng() * 60)),
    });
  }

  const yesterday = lusakaParts(addLusakaDays(now, -1));
  const yesterdayAt = (hour: number, minute: number) =>
    lusakaToUtc(yesterday.year, yesterday.month, yesterday.day, hour, minute, 0);
  await addRide({
    id: 'ride_richard_yesterday',
    busId: IDS.bus18,
    at: yesterdayAt(18, 15),
    passengerId: IDS.richard,
    label: 'Richard',
  });
  const yesterdayPlan: Array<[string, number]> = [
    [IDS.bus12, 53],
    [IDS.bus15, 52],
    [IDS.bus21, 52],
    [IDS.bus34, 52],
  ];
  for (const [busId, count] of yesterdayPlan) {
    for (let index = 0; index < count; index += 1) {
      const hour = 6 + (index % 14);
      await addRide({ busId, at: yesterdayAt(hour, Math.floor(rng() * 60)) });
    }
  }

  const activeBuses = [IDS.bus12, IDS.bus15, IDS.bus21, IDS.bus34];
  for (let ago = 2; ago <= 35; ago += 1) {
    const parts = lusakaParts(addLusakaDays(now, -ago));
    const count = 90 + Math.floor(rng() * 70);
    for (let index = 0; index < count; index += 1) {
      await addRide({
        busId: activeBuses[index % activeBuses.length] as string,
        at: lusakaToUtc(parts.year, parts.month, parts.day, 6 + Math.floor(rng() * 14), Math.floor(rng() * 60)),
      });
    }
  }

  await db.run(
    LOST_SQL,
    'lost_umbrella', null, null, IDS.bus12, IDS.mwila, IDS.owner, 'umbrella', 'Black umbrella', null,
    false, 'waiting', null, null, null, 'conductor', IDS.mwila, todayAt(8, 15), null, todayAt(8, 15), 0,
  );
  await db.run(
    LOST_SQL,
    'lost_richard_phone', 'ride_richard_today', IDS.richard, IDS.bus12, IDS.mwila, IDS.owner, 'phone',
    'Black Samsung phone, blue case', null, true, 'pickup_pending', 'P9X2', PICKUP_PLACE, nextPickupDeadline(now),
    'passenger', IDS.mwila, todayAt(9, 5), null, todayAt(7, 50), 0,
  );
  await db.run(
    LOST_SQL,
    'lost_namwinga_phone', 'ride_namwinga_today', IDS.namwinga, IDS.bus12, IDS.mwila, IDS.owner, 'phone',
    'Black Samsung phone, blue case', null, true, 'reported', null, null, null, 'passenger', null, null, null, todayAt(10, 50), 0,
  );

  await db.run(`INSERT INTO sms_messages (id, to_phone, body, status, lost_item_id, created_at)
    VALUES (?, ?, ?, 'queued', ?, ?)`,
    'sms_richard_found',
    PHONES.richard,
    `Twende: your phone was found on Bus 12. Pickup code P9X2 at ${PICKUP_PLACE}.`,
    'lost_richard_phone',
    todayAt(9, 6),
  );

  await db.run(
    `INSERT INTO meta (key, value) VALUES ('data_label', 'demo')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  );
}
