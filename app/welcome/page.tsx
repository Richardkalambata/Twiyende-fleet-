import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from '@/components/shell';

export default function WelcomePage() {
  return (
    <main className="min-h-dvh bg-[#EFEAE2] text-[#0F1A14] md:grid md:place-items-center md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F7F5F0] px-5 py-8 md:min-h-[844px] md:rounded-[36px] md:shadow-[0_1px_2px_rgba(7,61,39,0.06),0_24px_64px_rgba(7,61,39,0.12)]">
        <Wordmark subtitle="Lusaka minibuses" />
        <div className="relative mx-auto mt-8 aspect-square w-full max-w-[280px] overflow-hidden rounded-[24px] bg-[#E7F3EC]">
          <Image src="/onboarding/board.webp" alt="A rider boarding a Twende minibus" fill sizes="280px" className="object-contain p-2" />
        </div>
        <div className="mt-8">
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.02em]">Ride without cash.</h1>
          <p className="mt-3 text-[16px] leading-6 text-[#6B7570]">Top up once, pay any Twende bus, and keep a receipt for every trip.</p>
        </div>
        <div className="mt-auto space-y-3 pt-8 pb-[max(8px,env(safe-area-inset-bottom))]">
          <Link href="/signup" className="flex h-14 items-center justify-center rounded-full bg-[#0B5D3B] text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(7,61,39,0.18)]">Create account</Link>
          <Link href="/login" className="flex h-14 items-center justify-center rounded-full bg-white text-[16px] font-semibold shadow-[inset_0_0_0_1px_rgba(15,26,20,0.08)]">I already have an account</Link>
          <Link href="/business" className="block pt-2 text-center text-[13px] font-medium text-[#6B7570]">I run a fleet</Link>
        </div>
      </section>
    </main>
  );
}
