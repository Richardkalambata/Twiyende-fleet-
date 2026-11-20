'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Map, MapPin, Plus, Ticket } from 'lucide-react';
import { PayForm } from './pay-form';
import { Logo, Avatar } from './shell';
import { EmptyState } from './ui';
import { CountUp } from '@/components/motion/engine';
import { formatBalance } from '@/lib/money';
import type { BusOption, RideCard } from '@/lib/types';

export function HomeApp({
  name,
  initials,
  greeting,
  balanceNgwee,
  rides,
  monthCount,
  buses,
  initialFleet = '',
}: {
  name: string;
  initials: string;
  greeting: string;
  balanceNgwee: number;
  rides: RideCard[];
  monthCount: number;
  buses: BusOption[];
  initialFleet?: string;
}) {
  const [paying, setPaying] = useState(Boolean(initialFleet));
  const [preset, setPreset] = useState(initialFleet);
  const letters = name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || initials;
  if (paying) return <PayForm buses={buses} balanceNgwee={balanceNgwee} initialFleet={preset} onClose={() => setPaying(false)} />;
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-4 text-[#0B1B3B] lg:px-10 lg:py-8">
      <header className="safe-top flex items-center justify-between">
        <Logo />
        <Avatar initials={letters} size={36} />
      </header>
      <p className="mt-3 text-[15px] text-[#5C6578]">{greeting},</p>
      <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.04em]">{name.split(' ')[0]}</h1>
      <div className="lg:mt-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
      <div className="tilt-host mt-3 grid grid-cols-2 gap-2 lg:gap-4">
        <section data-tilt className="mesh elevate relative col-span-2 overflow-hidden rounded-[20px] p-4 text-white">
          <span className="sheen" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-[#D5DCEC]">Available balance</p>
            <Link href="/topup" className="relative z-10 flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 text-sm font-bold text-[#0B1B3B]"><Plus className="size-4" aria-hidden /> Add funds</Link>
          </div>
          <p className="num mt-1 text-[36px] font-extrabold leading-none tracking-[-0.04em] text-white"><CountUp ngwee={balanceNgwee} /></p>
          <p className="mt-1 text-[12px] font-semibold text-[#D5DCEC]">Twende wallet · ZMW</p>
        </section>
        <button type="button" onClick={() => { setPreset(''); setPaying(true); }} className="glow-pay press col-span-2 flex h-14 items-center justify-center gap-2 rounded-[20px] bg-[#1F5BFF] text-[18px] font-extrabold text-white">
          Pay a fare →
        </button>
        <Link href="/map" className="press col-span-2 flex h-14 items-center gap-3 rounded-[20px] bg-[#0B1B3B] px-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1F5BFF]"><Map className="h-5 w-5" /></span>
          <span>
            <span className="block text-[15px] font-extrabold">Live buses</span>
            <span className="block text-[12px] font-semibold text-[#D5DCEC]">See the fleet on the map</span>
          </span>
        </Link>
        <Link href="/rides" data-tilt className="elevate press flex min-h-[88px] flex-col justify-between rounded-[20px] bg-white p-3 text-[#0B1B3B]">
          <Ticket className="h-5 w-5 text-[#1F5BFF]" />
          <span>
            <span className="block text-[15px] font-extrabold">Rides</span>
            <span className="mt-0.5 block text-[12px] font-semibold text-[#3E4A63]">{monthCount} this month</span>
          </span>
        </Link>
        <Link href="/lost" data-tilt className="elevate press flex min-h-[88px] flex-col justify-between rounded-[20px] bg-white p-3 text-[#0B1B3B]">
          <MapPin className="h-5 w-5 text-[#1F5BFF]" />
          <span>
            <span className="block text-[15px] font-extrabold">Lost & found</span>
            <span className="mt-0.5 block text-[12px] font-semibold text-[#3E4A63]">Report an item</span>
          </span>
        </Link>
        <Link href="/wallet" className="press col-span-2 flex min-h-12 items-center justify-between rounded-xl bg-white px-4 text-sm font-bold text-[#0B1B3B]">
          Transaction history <span aria-hidden>→</span>
        </Link>
      </div>
      <section className="mt-4 lg:rounded-[20px] lg:bg-white lg:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold">Recent rides</h2>
          <Link href="/rides" className="text-[13px] font-semibold text-[#1F5BFF]">See all</Link>
        </div>
        {rides.length === 0 ? <div className="mt-2"><EmptyState title="No rides yet" body="Pay a fare and the last three trips will show up here." /></div> : (
          <ul className="stagger mt-2 overflow-hidden rounded-[20px] bg-white">
            {rides.map((ride) => (
              <li key={ride.id} className="border-b border-[#E6EAF2] last:border-0">
                <Link href={`/receipt/${ride.id}`} className="flex items-center gap-3 px-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E7EEFF] text-[12px] font-extrabold text-[#1F5BFF]">{ride.fleetNumber}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{ride.route}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[12px] font-semibold text-[#3E4A63]">
                      {ride.whenLabel}
                      {ride.status === 'verified' ? <span className="rounded-full bg-[#E8F8EF] px-2 py-0.5 text-[11px] font-bold text-[#0E7A45]">Complete</span> : ride.status === 'pending' ? <span className="rounded-full bg-[#FFF6E8] px-2 py-0.5 text-[11px] font-bold text-[#9A5B00]">Pending</span> : <span className="rounded-full bg-[#F4F6FB] px-2 py-0.5 text-[11px] font-bold text-[#3E4A63]">Cancelled</span>}
                    </span>
                  </span>
                  <span className="num text-[15px] font-extrabold">{formatBalance(ride.amountNgwee)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
