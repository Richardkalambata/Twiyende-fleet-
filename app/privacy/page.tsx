import { SiteFooter, SiteHeader } from '@/components/marketing/chrome';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[#F4F6FB] text-[#0B1B3B]">
      <div className="relative h-16 bg-[#0B1B3B] md:h-20"><SiteHeader /></div>
      <main className="mx-auto max-w-[720px] px-5 py-12">
        <h1 className="text-[40px] font-extrabold tracking-[-0.04em]">Privacy</h1>
        <p className="mt-4 text-[16px] leading-7 text-[#3E4A63]">Twende stores your name, phone number, PIN hash, rides, and lost-item reports so the fare and pickup flows work. Session cookies are httpOnly. Photos of lost items stay in the database with a size limit. SMS is recorded in the app and is not delivered.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
