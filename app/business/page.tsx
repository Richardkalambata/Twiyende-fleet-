import Link from 'next/link';
import { Bus, CalendarDays, Wallet } from 'lucide-react';
import { Logo } from '@/components/shell';

export const metadata = { title: 'Twende Fleet Business' };

const STEPS = [
  { icon: Wallet, title: 'Collections', body: 'See today’s takings' },
  { icon: Bus, title: 'Fleet', body: 'Buses and conductors' },
  { icon: CalendarDays, title: 'Shifts', body: 'One bus each day' },
];

export default function BusinessHome() {
  return (
    <main className="min-h-dvh bg-[#E8EDF5] text-[#0B1B3B] md:grid md:place-items-center md:p-8">
      <section className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[844px] md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]">
        <div className="relative h-[38dvh] min-h-[190px] max-h-[340px] shrink-0 bg-[#0B1B3B] md:h-[320px] md:max-h-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero-business.webp"
            srcSet="/brand/hero-business.webp 1x, /brand/hero-business@2x.webp 2x"
            alt="Two conductors beside a Lusaka bus"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0B1B3B]/90 via-[#0B1B3B]/40 to-transparent" />
          <div className="absolute left-5 top-[max(14px,env(safe-area-inset-top))]"><Logo tone="light" business /></div>
        </div>
        <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-4">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#6B7288]">FLEET BUSINESS</p>
          <h1 className="mt-1 text-[clamp(26px,7vw,34px)] font-extrabold leading-[1.05] tracking-[-0.045em]">Every fare. Every bus. In view.</h1>
          <p className="mt-1 text-[14px] text-[#5C6578]">A simpler way to manage your fleet.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl bg-[#F4F6FB] px-2 py-2.5 text-center">
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[#E7EEFF] text-[#1F5BFF]">
                  <step.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="mt-1.5 text-[12px] font-bold leading-tight">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#5C6578]">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
            <Link href="/business/login" className="flex min-h-[76px] flex-col justify-center rounded-2xl bg-[#1F5BFF] px-3 py-3 text-white">
              <span className="text-[14px] font-bold leading-tight">I&apos;m an operator</span>
              <span className="mt-1 text-[12px] leading-4 text-white/80">Sign in or create a company</span>
            </Link>
            <Link href="/business/conductor/login" className="flex min-h-[76px] flex-col justify-center rounded-2xl bg-[#0B1B3B] px-3 py-3 text-white">
              <span className="text-[14px] font-bold leading-tight">I&apos;m a conductor</span>
              <span className="mt-1 text-[12px] leading-4 text-white/80">Sign in</span>
            </Link>
          </div>
          <Link href="/" className="block pb-1 pt-2 text-center text-[12px] font-semibold text-[#5C6578]">Passenger? Open Twende</Link>
        </div>
      </section>
    </main>
  );
}
