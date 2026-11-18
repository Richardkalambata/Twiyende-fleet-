'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Ticket, Wallet } from 'lucide-react';
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
  const latest = rides[0];
  if (paying) return <PayForm buses={buses} balanceNgwee={balanceNgwee} onClose={() => setPaying(false)} />;
  return (
    <div className="px-5 pb-4 text-[#0B1B3B]">
      <header className="safe-top flex items-center justify-between">
        <Logo />
        <Avatar initials={letters} size={36} />
      </header>
      <p className="mt-5 text-[15px] text-[#5C6578]">Good morning,</p>
      <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.04em]">{name.split(' ')[0]}</h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <section className="mesh col-span-2 rounded-[20px] p-5 text-white">
          <p className="text-[13px] font-semibold text-[#D5DCEC]">Available balance</p>
          <p className="num mt-2 text-[36px] font-extrabold leading-none tracking-[-0.04em] text-white">{formatBalance(balanceNgwee)}</p>
          <p className="mt-2 text-[12px] font-semibold text-[#D5DCEC]">Twende wallet · ZMW</p>
        </section>
        <button type="button" onClick={() => setPaying(true)} className="glow-pay press col-span-2 flex h-[72px] items-center justify-center gap-2 rounded-[20px] bg-[#1F5BFF] text-[18px] font-extrabold text-white">
          Pay a fare →
        </button>
        <Link href="/rides" className="press flex min-h-[104px] flex-col justify-between rounded-[20px] bg-white p-4 text-[#0B1B3B]">
          <Ticket className="h-5 w-5 text-[#1F5BFF]" />
          <span>
            <span className="block text-[15px] font-extrabold">Rides</span>
            <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#3E4A63]">{latest ? `Bus ${latest.fleetNumber} · ${formatBalance(latest.amountNgwee)}` : 'No trips yet'}</span>
          </span>
        </Link>
        <Link href="/lost" className="press flex min-h-[104px] flex-col justify-between rounded-[20px] bg-white p-4 text-[#0B1B3B]">
          <MapPin className="h-5 w-5 text-[#1F5BFF]" />
          <span>
            <span className="block text-[15px] font-extrabold">Lost & found</span>
            <span className="mt-0.5 block text-[12px] font-semibold text-[#3E4A63]">Report an item</span>
          </span>
        </Link>
        <Link href="/topup" className="press col-span-2 flex min-h-[72px] items-center gap-3 rounded-[20px] bg-white px-4 text-[#0B1B3B]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7EEFF] text-[#1F5BFF]"><Wallet className="h-5 w-5" /></span>
          <span>
            <span className="block text-[15px] font-extrabold">Top up</span>
            <span className="block text-[12px] font-semibold text-[#3E4A63]">MTN, Airtel, or Zamtel</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
