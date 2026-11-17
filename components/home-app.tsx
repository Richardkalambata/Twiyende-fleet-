'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
import { PayForm } from './pay-form';
import { Logo, Avatar } from './shell';
import { formatBalance } from '@/lib/money';
import type { BusOption, RideCard } from '@/lib/types';

export function HomeApp({
  name,
  initials,
  balanceNgwee,
  rides,
  buses,
}: {
  name: string;
  initials: string;
  balanceNgwee: number;
  rides: RideCard[];
  buses: BusOption[];
}) {
  const [paying, setPaying] = useState(false);
  if (paying) return <PayForm buses={buses} balanceNgwee={balanceNgwee} onClose={() => setPaying(false)} />;
  return (
    <div className="px-5 pb-4 text-[#0B1B3B]">
      <header className="safe-top flex items-center justify-between">
        <Logo />
        <Avatar initials={initials} size={36} />
      </header>
      <p className="mt-5 text-[15px] text-[#5C6578]">Good morning,</p>
      <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.04em]">{name}</h1>
      <section className="mt-4 rounded-2xl bg-[#0B1B3B] p-4 text-white">
        <p className="text-[12px] text-white/70">Available balance</p>
        <p className="mt-1 text-[36px] font-extrabold tracking-[-0.04em]">{formatBalance(balanceNgwee)}</p>
        <p className="text-[12px] text-white/60">Twende wallet · ZMW</p>
        <Link href="/topup" className="mt-3 inline-flex h-9 items-center rounded-full bg-white px-3 text-[13px] font-bold text-[#0B1B3B]">+ Top up</Link>
      </section>
      <button type="button" onClick={() => setPaying(true)} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white">Pay a fare →</button>
      <Link href="/lost" className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold">
        Lost & found <ChevronRight className="h-4 w-4 text-[#8A93A6]" />
      </Link>
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold">Recent rides</h2>
        <Link href="/rides" className="text-[13px] font-semibold text-[#1F5BFF]">See all</Link>
      </div>
      <ul className="mt-2">
        {rides.map((ride) => (
          <li key={ride.id}>
            <Link href={ride.status === 'pending' ? `/receipt/${ride.id}` : '/rides'} className="flex items-center gap-3 border-b border-[#E6EAF2] py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Bus {ride.fleetNumber}</span>
                <span className="block truncate text-[12px] text-[#5C6578]">{ride.whenLabel}</span>
              </span>
              <span className="font-bold">{formatBalance(ride.amountNgwee)}</span>
              {ride.status === 'verified' ? <Check className="h-4 w-4 text-[#12B76A]" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
