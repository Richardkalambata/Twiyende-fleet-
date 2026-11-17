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
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white md:min-h-[844px] md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]">
        <div className="relative h-[46%] min-h-[300px] overflow-hidden bg-[#0B1B3B]">
          {/* 1x and 2x webp; next/image cannot pair a custom srcSet for both files. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero-rider.webp"
            srcSet="/brand/hero-rider.webp 1x, /brand/hero-rider@2x.webp 2x"
            alt="Passengers boarding a Lusaka bus"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0B1B3B]/70 to-transparent" />
          <div className="absolute left-5 top-[max(16px,env(safe-area-inset-top))]"><Logo tone="light" /></div>
          <div className="absolute -bottom-6 left-[-8%] right-[-8%] h-16 rotate-[-6deg] bg-white" />
        </div>
        <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#8A93A6]">CASHLESS MINIBUS FARES</p>
          <h1 className="mt-2 text-[34px] font-extrabold leading-[1.02] tracking-[-0.045em]">Lusaka moves.<br />So do you.</h1>
          <ul className="mt-5 divide-y divide-[#E6EAF2] border-y border-[#E6EAF2]">
            {ROWS.map((row) => (
              <li key={row.title} className="flex items-center gap-3 py-3 text-[15px] font-semibold">
                <row.icon className="h-5 w-5 text-[#1F5BFF]" strokeWidth={1.75} />
                {row.title}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white">Create account</Link>
          <Link href="/login" className="mt-3 block text-center text-[14px] font-semibold text-[#1F5BFF]">I already have an account</Link>
          <Link href="/business" className="mt-2 block text-center text-[14px] font-semibold text-[#0B1B3B]">I run a fleet →</Link>
        </div>
      </section>
    </main>
  );
}
