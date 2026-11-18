import Link from 'next/link';
import { Bus, QrCode, Ticket, Wallet } from 'lucide-react';
import { Logo } from './shell';

const STEPS = [
  { icon: Wallet, title: 'Top up', body: 'MTN, Airtel, or Zamtel' },
  { icon: Bus, title: 'Board', body: 'Enter the bus number' },
  { icon: QrCode, title: 'Show code', body: 'One code, one ride' },
  { icon: Ticket, title: 'Lost item', body: 'Report it and track it' },
];

export function Onboarding() {
  return (
    <main className="min-h-dvh bg-[#E8EDF5] text-[#0B1B3B] md:grid md:place-items-center md:p-6">
      <section className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[844px] md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]">
        <div className="relative h-[40dvh] min-h-[200px] max-h-[360px] shrink-0 bg-[#0B1B3B] md:h-[340px] md:max-h-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero-rider.webp"
            srcSet="/brand/hero-rider.webp 1x, /brand/hero-rider@2x.webp 2x"
            alt="Passengers boarding a Lusaka bus"
            className="absolute inset-0 h-full w-full object-cover object-[28%_38%]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0B1B3B]/90 via-[#0B1B3B]/45 to-transparent" />
          <div className="absolute left-5 top-[max(14px,env(safe-area-inset-top))]"><Logo tone="light" /></div>
        </div>
        <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-4">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#6B7288]">CASHLESS MINIBUS FARES</p>
          <h1 className="mt-1 text-[clamp(26px,7.2vw,34px)] font-extrabold leading-[1.05] tracking-[-0.045em]">Lusaka moves.<br />So do you.</h1>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl bg-[#F4F6FB] px-3 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E7EEFF] text-[#1F5BFF]">
                  <step.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="mt-1.5 text-[13px] font-bold leading-tight">{step.title}</p>
                <p className="mt-0.5 truncate text-[12px] leading-4 text-[#5C6578]">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-2 pt-3">
            <Link href="/signup" className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white">Create account</Link>
            <Link href="/login" className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-[15px] font-bold text-[#0B1B3B] ring-1 ring-[#D5DCE8]">I already have an account</Link>
            <Link href="/business" className="block pb-1 pt-0.5 text-center text-[12px] font-semibold text-[#5C6578]">Operator or conductor? Twende Fleet Business</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
