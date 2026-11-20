import { SiteFooter, SiteHeader } from '@/components/marketing/chrome';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#F4F6FB] text-[#0B1B3B]">
      <div className="relative h-16 bg-[#0B1B3B] md:h-20"><SiteHeader /></div>
      <main className="mx-auto max-w-[720px] px-5 py-12">
        <h1 className="text-[40px] font-extrabold tracking-[-0.04em]">Terms</h1>
        <p className="mt-4 text-[16px] leading-7 text-[#3E4A63]">Twende is a cashless fare app for Lusaka minibuses. A ride code is valid once, for three hours, and only on the bus you paid for. Operators create conductor accounts. This version records wallet top-ups and payouts without sending a live mobile-money charge.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
