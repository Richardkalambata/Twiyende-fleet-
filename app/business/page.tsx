import Link from 'next/link';
import Image from 'next/image';
import { Bus, CalendarDays, Wallet } from 'lucide-react';
import { Logo } from '@/components/shell';

export const metadata = { title: 'Twende Fleet Business' };

const ROWS = [
  { icon: Wallet, title: 'Track fare collections' },
  { icon: Bus, title: 'Manage buses & conductors' },
  { icon: CalendarDays, title: 'Keep shifts organised' },
];

export default function BusinessHome() {
  return (
    <main className="min-h-dvh bg-[#E8EDF5] text-[#0B1B3B] md:grid md:place-items-center md:p-8">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F4F6FB] md:min-h-[844px] md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]">
        <div className="relative h-[260px] overflow-hidden bg-[#0B1B3B]">
          <Image src="/onboarding/board.webp" alt="Conductors beside a Lusaka bus" fill className="object-cover" sizes="430px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3B] via-transparent to-[#0B1B3B]/30" />
          <div className="absolute left-5 top-[max(16px,env(safe-area-inset-top))]"><Logo tone="light" business /></div>
        </div>
        <div className="flex flex-1 flex-col px-5 py-6">
          <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em]">Every fare. Every bus. In view.</h1>
          <p className="mt-2 text-[15px] text-[#5C6578]">A simpler way to manage your fleet.</p>
          <ul className="mt-6 space-y-3">
            {ROWS.map((row) => (
              <li key={row.title} className="flex items-center gap-3 font-semibold">
                <row.icon className="h-5 w-5 text-[#1F5BFF]" strokeWidth={1.75} />
                {row.title}
              </li>
            ))}
          </ul>
          <Link href="/business/signup" className="mt-8 flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] font-bold text-white">Create operator account</Link>
          <Link href="/business/login" className="mt-3 block text-center text-[14px] font-semibold">Operator or conductor? Log in</Link>
          <Link href="/" className="mt-2 block text-center text-[14px] text-[#5C6578]">Passenger? Open Twende Fleet →</Link>
        </div>
      </section>
    </main>
  );
}
