'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bus, QrCode, Ticket, Wallet } from 'lucide-react';
import { Logo } from './shell';

const ROWS = [
  { icon: Wallet, title: 'Top up' },
  { icon: Bus, title: 'Board your bus' },
  { icon: QrCode, title: 'Show your code' },
  { icon: Ticket, title: 'Lost & found support' },
];

export function Onboarding() {
  return (
    <main className="min-h-dvh bg-[#E8EDF5] text-[#0B1B3B] md:grid md:place-items-center md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F4F6FB] md:min-h-[844px] md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]">
        <div className="relative h-[280px] overflow-hidden bg-[#0B1B3B]">
          <Image src="/onboarding/board.webp" alt="Boarding a Lusaka minibus" fill priority className="object-cover object-[center_40%] opacity-90" sizes="430px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3B] via-[#0B1B3B]/20 to-transparent" />
          <div className="absolute left-5 top-[max(16px,env(safe-area-inset-top))]"><Logo tone="light" /></div>
          <div className="absolute bottom-0 left-0 right-[18%] h-10 translate-y-1/2 rotate-[-8deg] bg-[#F4F6FB]" />
        </div>
        <div className="flex flex-1 flex-col px-5 pb-6 pt-6">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#8A93A6]">CASHLESS MINIBUS FARES</p>
          <h1 className="mt-2 text-[36px] font-extrabold leading-[1.02] tracking-[-0.04em]">Lusaka moves.<br />So do you.</h1>
          <ul className="mt-6 space-y-3">
            {ROWS.map((row) => (
              <li key={row.title} className="flex items-center gap-3 text-[15px] font-semibold">
                <row.icon className="h-5 w-5 text-[#1F5BFF]" strokeWidth={1.75} />
                {row.title}
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-3 pt-8">
            <Link href="/signup" className="flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white">Create account</Link>
            <Link href="/login" className="block text-center text-[14px] font-semibold text-[#5C6578]">I already have an account</Link>
            <Link href="/business" className="block text-center text-[14px] font-semibold text-[#0B1B3B]">I run a fleet →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
