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
  const letters = name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || initials;
  if (paying) return <PayForm buses={buses} balanceNgwee={balanceNgwee} onClose={() => setPaying(false)} />;
  return (
    <div className="px-5 pb-4 text-[#0B1B3B]">
      <header className="safe-top flex items-center justify-between">
        <Logo />
        <Avatar initials={letters} size={36} />
      </header>
      <p className="mt-5 text-[15px] text-[#5C6578]">Good morning,</p>
      <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.04em]">{name.split(' ')[0]}</h1>
      <section className="relative mt-4 overflow-hidden rounded-[20px] bg-[#0B1B3B] p-5 text-white shadow-[0_16px_40px_rgba(11,27,59,0.18)]">
        <div className="pointer-events-none absolute -right-6 -top-8 h-36 w-40 rotate-12 bg-[repeating-linear-gradient(115deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_12px)]" />
        <p className="text-[13px] text-white/70">Available balance</p>
        <p className="num mt-1 text-[36px] font-extrabold leading-none tracking-[-0.04em]">{formatBalance(balanceNgwee)}</p>
        <p className="mt-1 text-[12px] text-white/60">Twende wallet · ZMW</p>
        <Link href="/topup" className="press relative mt-4 inline-flex h-9 items-center rounded-full bg-white px-3 text-[13px] font-bold text-[#0B1B3B]">+ Top up</Link>
      </section>
      <button type="button" onClick={() => setPaying(true)} className="press mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(31,91,255,0.28)]">Pay a fare →</button>
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
            <Link href={ride.status === 'pending' ? `/receipt/${ride.id}` : `/receipt/${ride.id}`} className="flex items-center gap-3 border-b border-[#E6EAF2] py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E7EEFF] text-[#1F5BFF]">
                <span className="text-[11px] font-extrabold">{ride.fleetNumber}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">Bus {ride.fleetNumber}</span>
                <span className="block truncate text-[12px] text-[#5C6578]">{ride.route} · {ride.whenLabel}</span>
              </span>
              <span className="text-right">
                <span className="num block text-[15px] font-bold">{formatBalance(ride.amountNgwee)}</span>
                {ride.status === 'verified' ? <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#128A4E]"><Check className="h-3 w-3" />Verified</span> : ride.status === 'pending' ? <span className="text-[11px] font-bold text-[#C47B12]">Pending</span> : <span className="text-[11px] font-semibold text-[#8A93A6]">Cancelled</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
