import Link from 'next/link';
import { Wordmark } from '@/components/shell';

export default function WelcomePage() {
  return (
    <main className="min-h-dvh bg-[#EFEAE3] md:grid md:place-items-center md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-between bg-[#F7F5F0] px-6 py-10 md:min-h-[844px] md:rounded-[36px] md:shadow-[0_30px_80px_rgba(20,36,28,0.16)]">
        <Wordmark subtitle="Lusaka minibuses" />
        <div>
          <h1 className="text-[40px] font-semibold leading-tight tracking-tight">Ride without cash.</h1>
          <p className="mt-3 text-base leading-6 text-[#5C6B63]">Top up once, pay any Twende bus, and keep a receipt for every trip.</p>
        </div>
        <div className="space-y-3">
          <Link href="/signup" className="flex h-14 items-center justify-center rounded-full bg-[#0B5D3B] text-base font-semibold text-white">Create account</Link>
          <Link href="/login" className="flex h-14 items-center justify-center rounded-full border border-[#D9D1C5] bg-white text-base font-semibold">I already have an account</Link>
          <Link href="/business" className="block pt-2 text-center text-sm text-[#6A756E]">I run a fleet</Link>
        </div>
      </section>
    </main>
  );
}
