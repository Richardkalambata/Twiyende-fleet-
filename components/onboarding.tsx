import Image from 'next/image';
import Link from 'next/link';
import { Bus, QrCode, Wallet } from 'lucide-react';
import { blur } from '@/components/marketing/blur';
import { SiteFooter, SiteHeader } from '@/components/marketing/chrome';
import { Still, StepRail } from '@/components/marketing/motion';
import { Faq, Reveal, StickyBar } from '@/components/marketing/ui';

const FAQ = [
  { q: 'How do I pay a fare?', a: 'Top up your wallet, enter the bus number, choose the fare, and show the code on your ticket.' },
  { q: 'How long is a code valid?', a: 'Three hours, and only on the bus you paid for. A code works once.' },
  { q: 'What if I board the wrong bus?', a: 'Cancel the fare from the ticket before it is verified. The amount returns to your wallet.' },
  { q: 'I left something on the bus.', a: 'Open Lost & found, pick the trip, and describe the item. You get a pickup code when it is found.' },
  { q: 'Which networks can I top up with?', a: 'MTN, Airtel, or Zamtel. The wallet updates in the app. This version does not send a live mobile-money charge.' },
];

const STEPS = [
  { icon: Wallet, title: 'Top up', body: 'Add money to your Twende wallet and choose MTN, Airtel, or Zamtel.' },
  { icon: Bus, title: 'Enter the bus number', body: 'Type the number on the bus and pick the fare for that route.' },
  { icon: QrCode, title: 'Show the code', body: 'One code. The conductor verifies it once, on that bus.' },
];

export function Onboarding() {
  return (
    <div className="bg-[#F7F8FB] text-[#0B1B3B]">
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden text-white md:h-[88vh]">
        <Image
          src="/brand/campaign-rider.jpg"
          alt="A woman laughing at her phone beside a Lusaka minibus"
          fill
          priority
          quality={85}
          placeholder="blur"
          blurDataURL={blur['campaign-rider']}
          sizes="100vw"
          className="ken-burns object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071230] via-[#071230]/75 to-[#071230]/20 md:bg-gradient-to-r md:from-[#071230] md:via-[#071230]/78 md:to-[#071230]/15" />
        <SiteHeader />
        <div className="relative z-10 mx-auto grid h-full max-w-[1200px] grid-cols-12 items-end px-5 pb-24 md:items-center md:px-8 md:pb-0">
          <div className="col-span-12 max-w-xl md:col-span-6">
            <p className="line-reveal text-[12px] font-bold tracking-[0.16em] text-[#8FB0FF]">CASHLESS MINIBUS FARES</p>
            <h1 className="mt-4 text-[42px] font-extrabold leading-[1.02] tracking-[-0.045em] md:text-[76px]">
              <span className="line-reveal block" style={{ animationDelay: '120ms' }}>Pay your bus fare</span>
              <span className="line-reveal block text-[#4C7DFF]" style={{ animationDelay: '260ms' }}>in seconds.</span>
            </h1>
            <p className="line-reveal mt-4 max-w-md text-[16px] leading-6 text-[#E7ECF8] md:text-[18px]" style={{ animationDelay: '400ms' }}>
              Top up, enter the bus number, and show one code to the conductor.
            </p>
            <div id="hero-ctas" className="line-reveal mt-6 flex flex-wrap gap-3" style={{ animationDelay: '520ms' }}>
              <Link href="/signup" className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-5 text-[15px] font-bold text-white">Create account</Link>
              <Link href="/login" className="inline-flex h-12 items-center rounded-xl bg-white/10 px-5 text-[15px] font-bold text-white ring-1 ring-white/30">Sign in</Link>
            </div>
          </div>
        </div>
        <p className="card-rise glass absolute bottom-[22%] right-[12%] hidden rounded-2xl px-4 py-3 text-[14px] font-semibold text-white md:block">✓ Fare verified · Bus 12 · K5.00</p>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
        <Reveal className="md:col-span-6">
          <Still src="/brand/moment-ride.jpg" blur={blur['moment-ride']} alt="A mother and child looking at a phone on a minibus" />
        </Reveal>
        <Reveal delay={80} className="md:col-span-6">
          <p className="text-[12px] font-bold tracking-[0.16em] text-[#1F5BFF]">ON BOARD</p>
          <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[52px]">No change. No arguments. Just ride.</h2>
          <p className="mt-4 max-w-md text-[17px] leading-7 text-[#3E4A63]">The fare is already on your phone. You sit down. The conductor sees the code. That is the whole conversation.</p>
        </Reveal>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-28">
          <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em] md:text-[44px]">How it works</h2></Reveal>
          <StepRail>
            <ol className="relative mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-[#E7EEFF] text-[#1F5BFF]"><step.icon className="h-6 w-6" /></span>
                  <p className="mt-4 text-[13px] font-bold tracking-[0.14em] text-[#1F5BFF]">0{index + 1}</p>
                  <h3 className="mt-1 text-[22px] font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">{step.body}</p>
                </li>
              ))}
            </ol>
          </StepRail>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-12 md:gap-16 md:px-8 md:py-28">
        <Reveal className="md:order-2 md:col-span-6">
          <Still src="/brand/moment-verify.jpg" blur={blur['moment-verify']} alt="A passenger showing his phone to a smiling conductor" />
        </Reveal>
        <Reveal delay={80} className="md:order-1 md:col-span-6">
          <p className="text-[12px] font-bold tracking-[0.16em] text-[#1F5BFF]">THE CONDUCTOR</p>
          <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[48px]">Verified in the time it takes to smile.</h2>
          <p className="mt-4 text-[17px] leading-7 text-[#3E4A63]">They type the four characters. The ticket turns green. A used code, or a code for another bus, stops there.</p>
        </Reveal>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-28">
          <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em] md:text-[44px]">What you carry</h2></Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Reveal className="md:col-span-2"><article className="h-full rounded-[24px] bg-[#0B1B3B] p-6 text-white"><p className="text-[13px] font-bold text-[#8FB0FF]">Live ticket</p><p className="mt-4 text-[40px] font-extrabold tracking-[0.14em]">EXJP</p><p className="mt-3 text-[15px] text-[#D5DCEC]">The code stays on screen until the conductor verifies it.</p></article></Reveal>
            <Reveal delay={80} className="md:col-span-2"><article className="h-full rounded-[24px] bg-[#F4F6FB] p-6"><p className="text-[13px] font-bold text-[#1F5BFF]">Receipts</p><h3 className="mt-3 text-[24px] font-extrabold">Every ride, kept</h3><p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">Bus, route, time, and whether the fare was verified.</p></article></Reveal>
            <Reveal delay={120}><article className="h-full rounded-[24px] bg-[#F4F6FB] p-6"><h3 className="text-[20px] font-extrabold">Lost & found</h3><p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">Report an item from a trip you paid for and follow it to pickup.</p></article></Reveal>
            <Reveal delay={160} className="md:col-span-3"><article className="rounded-[24px] bg-[#F4F6FB] p-6"><h3 className="text-[20px] font-extrabold">Top up</h3><div className="mt-3 flex flex-wrap gap-2">{['MTN', 'Airtel', 'Zamtel'].map((name) => <span key={name} className="rounded-full bg-white px-3 py-1 text-[13px] font-bold">{name}</span>)}</div></article></Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1B3B] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center md:px-8 md:py-20">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-[-0.04em]">Run the fleet</h2>
            <p className="mt-3 max-w-lg text-[16px] leading-7 text-[#D5DCEC]">Operators see the fares. Conductors verify the codes. Twende Fleet Business is the other door.</p>
          </div>
          <Link href="/business" className="inline-flex h-12 items-center rounded-xl bg-white px-5 text-[15px] font-bold text-[#0B1B3B]">Open Fleet Business</Link>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[800px] px-5 py-16 md:py-28">
        <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em]">Questions</h2></Reveal>
        <div className="mt-6"><Faq items={FAQ} /></div>
      </section>

      <section className="relative overflow-hidden text-white">
        <Image src="/brand/campaign-rider.jpg" alt="" fill quality={85} className="object-cover object-[70%_center]" sizes="100vw" />
        <div className="absolute inset-0 bg-[#071230]/78" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-5 py-24 md:px-8 md:py-32">
          <h2 className="max-w-xl text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[56px]">Your next ride starts here.</h2>
          <p className="max-w-md text-[16px] leading-7 text-[#E7ECF8]">Create a passenger account with your phone number and a 4-digit PIN.</p>
          <Link href="/signup" className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-5 text-[15px] font-bold">Create account</Link>
        </div>
      </section>
      <SiteFooter />
      <StickyBar primary={{ href: '/signup', label: 'Create account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </div>
  );
}
