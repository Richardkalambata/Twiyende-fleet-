import Link from 'next/link';
import { CtaBand, SiteFooter, SiteHeader } from '@/components/marketing/chrome';
import { RiderPhone } from '@/components/marketing/frames';
import { Faq, Reveal, StickyBar } from '@/components/marketing/ui';

const STEPS = [
  { n: '01', title: 'Top up', body: 'Add money to your Twende wallet and pick MTN, Airtel, or Zamtel.' },
  { n: '02', title: 'Enter the bus number', body: 'Type the number on the bus and choose the fare for that route.' },
  { n: '03', title: 'Show the code', body: 'A 4-character code appears. The conductor verifies it once, on that bus.' },
];

const FAQ = [
  { q: 'How do I pay a fare?', a: 'Top up your wallet, enter the bus number, choose the fare, and show the code on your ticket.' },
  { q: 'How long is a code valid?', a: 'Three hours, and only on the bus you paid for. A code works once.' },
  { q: 'What if I board the wrong bus?', a: 'Cancel the fare from the ticket before it is verified. The amount returns to your wallet.' },
  { q: 'I left something on the bus.', a: 'Open Lost & found, pick the trip, and describe the item. You get a pickup code when it is found.' },
  { q: 'Which networks can I top up with?', a: 'MTN, Airtel, or Zamtel. The wallet updates in the app. This version does not send a live mobile-money charge.' },
];

export function Onboarding() {
  return (
    <div className="bg-[#F4F6FB] text-[#0B1B3B]">
      <section className="hero-stage relative overflow-x-hidden text-white">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="hero-grain pointer-events-none absolute inset-0" />
        <SiteHeader />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-4 px-5 pb-10 pt-20 md:grid-cols-2 md:gap-8 md:px-8 md:pb-24 md:pt-32">
          <div>
            <p className="hero-enter text-[12px] font-bold tracking-[0.16em] text-[#8FB0FF]">CASHLESS MINIBUS FARES</p>
            <h1 className="hero-enter mt-3 max-w-[16ch] text-[34px] font-extrabold leading-[1.02] tracking-[-0.045em] md:max-w-[14ch] md:text-[64px]" style={{ animationDelay: '80ms' }}>
              Pay your bus fare <span className="text-[#1F5BFF]">in seconds.</span>
            </h1>
            <p className="hero-enter mt-4 max-w-md text-[16px] leading-6 text-[#D5DCEC] md:text-[18px]" style={{ animationDelay: '160ms' }}>
              Top up, enter the bus number, and show one code to the conductor.
            </p>
            <div id="hero-ctas" className="hero-enter mt-6 flex flex-wrap gap-3" style={{ animationDelay: '240ms' }}>
              <Link href="/signup" className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-5 text-[15px] font-bold text-white">Create account</Link>
              <Link href="/login" className="inline-flex h-12 items-center rounded-xl bg-white/10 px-5 text-[15px] font-bold text-white ring-1 ring-white/25">Sign in</Link>
            </div>
          </div>
          <div className="hero-enter w-full min-w-0" style={{ animationDelay: '180ms' }}>
            <RiderPhone />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <Reveal>
          <h2 className="text-[32px] font-extrabold tracking-[-0.04em] md:text-[40px]">How it works</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 80}>
              <article className="h-full rounded-[20px] bg-white p-5">
                <p className="text-[13px] font-extrabold tracking-[0.14em] text-[#1F5BFF]">{step.n}</p>
                <div className="mt-4 rounded-2xl bg-[#F4F6FB] p-4">
                  {index === 0 ? <MiniTopup /> : index === 1 ? <MiniBus /> : <MiniCode />}
                </div>
                <h3 className="mt-4 text-[20px] font-extrabold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
          <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em] md:text-[40px]">Everything for the ride</h2></Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Reveal className="md:col-span-2">
              <article className="h-full rounded-[20px] bg-[#0B1B3B] p-6 text-white">
                <p className="text-[13px] font-bold text-[#8FB0FF]">Live ticket</p>
                <p className="mt-3 text-[28px] font-extrabold tracking-[0.16em]">EXJP</p>
                <p className="mt-2 text-[15px] text-[#D5DCEC]">The code stays on screen until the conductor verifies it.</p>
              </article>
            </Reveal>
            <Reveal delay={80} className="md:col-span-2">
              <article className="h-full rounded-[20px] bg-[#F4F6FB] p-6">
                <p className="text-[13px] font-bold text-[#1F5BFF]">Ride history</p>
                <p className="mt-2 text-[22px] font-extrabold">Receipts you can open later</p>
                <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">Each fare keeps the bus, route, time, and whether it was verified.</p>
              </article>
            </Reveal>
            <Reveal delay={120}>
              <article className="h-full rounded-[20px] bg-[#F4F6FB] p-6 md:col-span-2">
                <p className="text-[18px] font-extrabold">Lost & found</p>
                <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">Report an item from a trip you paid for and track it to pickup.</p>
              </article>
            </Reveal>
            <Reveal delay={160} className="md:col-span-3">
              <article className="rounded-[20px] bg-[#F4F6FB] p-6">
                <p className="text-[18px] font-extrabold">Top up from the networks you already use</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['MTN', 'Airtel', 'Zamtel'].map((name) => (
                    <span key={name} className="rounded-full bg-white px-3 py-1 text-[13px] font-bold">{name}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8">
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-rider.webp" alt="Passengers boarding a Lusaka bus" width={960} height={640} className="h-72 w-full rounded-[24px] object-cover md:h-96" />
        </Reveal>
        <Reveal delay={80}>
          <p className="text-[12px] font-bold tracking-[0.16em] text-[#1F5BFF]">ON THE ROAD</p>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.04em]">Built for the Lusaka stage</h2>
          <p className="mt-3 text-[16px] leading-7 text-[#3E4A63]">The fare lives on your phone. The conductor checks a short code. No cash handed down the aisle.</p>
        </Reveal>
      </section>

      <section className="bg-[#0B1B3B] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-5 py-12 md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">For operators</h2>
            <p className="mt-2 max-w-lg text-[15px] leading-6 text-[#D5DCEC]">See today’s fares, assign conductors, and keep lost items moving. Twende Fleet Business is the other door.</p>
          </div>
          <Link href="/business" className="inline-flex h-12 items-center rounded-xl bg-white px-5 text-[15px] font-bold text-[#0B1B3B]">Open Fleet Business</Link>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[800px] px-5 py-16 md:py-24">
        <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em]">Questions</h2></Reveal>
        <div className="mt-6"><Faq items={FAQ} /></div>
      </section>

      <CtaBand title="Your next ride starts here." body="Create a passenger account with your phone number and a 4-digit PIN." href="/signup" label="Create account" />
      <SiteFooter />
      <StickyBar primary={{ href: '/signup', label: 'Create account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </div>
  );
}

function MiniTopup() {
  return (
    <div className="text-[12px] font-bold text-[#0B1B3B]">
      <p className="text-[22px]">K50.00</p>
      <div className="mt-2 flex gap-1">{['K20', 'K50', 'K100'].map((amount) => <span key={amount} className={`rounded-md px-2 py-1 ${amount === 'K50' ? 'bg-[#1F5BFF] text-white' : 'bg-white'}`}>{amount}</span>)}</div>
    </div>
  );
}

function MiniBus() {
  return (
    <div>
      <p className="text-[28px] font-extrabold leading-none">12</p>
      <p className="mt-1 text-[12px] font-semibold text-[#3E4A63]">Town to Matero</p>
    </div>
  );
}

function MiniCode() {
  return <p className="text-center text-[28px] font-extrabold tracking-[0.18em] text-[#0B1B3B]">EXJP</p>;
}
