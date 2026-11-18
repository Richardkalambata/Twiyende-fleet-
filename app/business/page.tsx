import Link from 'next/link';
import { CtaBand, SiteFooter, SiteHeader } from '@/components/marketing/chrome';
import { KeypadMock, OperatorLaptop } from '@/components/marketing/frames';
import { Faq, Reveal, StickyBar } from '@/components/marketing/ui';

export const metadata = { title: 'Twende Fleet Business' };

const FLOW = [
  { n: '01', title: 'Add buses', body: 'Fleet number, plate, route, and the default fare.' },
  { n: '02', title: 'Add conductors', body: 'You create their phone number and PIN. They do not sign themselves up.' },
  { n: '03', title: 'Assign the day', body: 'One conductor on one bus. That is the only bus their codes will verify.' },
  { n: '04', title: 'Watch fares come in', body: 'Verified tickets show on the desk as they happen.' },
];

const FAQ = [
  { q: 'How does a conductor get an account?', a: 'The operator adds them and sets the phone number and PIN. There is no conductor sign-up.' },
  { q: 'Can a code be used twice?', a: 'No. After a conductor verifies it, the same code is refused.' },
  { q: 'What if the code is for another bus?', a: 'The conductor sees which bus it belongs to and cannot verify it on theirs.' },
  { q: 'How do payouts work?', a: 'The desk shows what was collected. You can record a payout and mark a bus day settled. No fee is taken in this version.' },
  { q: 'Where do passengers sign in?', a: 'On the Twende rider app. This door is for operators and conductors only.' },
];

export default function BusinessHome() {
  return (
    <div className="bg-[#F4F6FB] text-[#0B1B3B]">
      <section className="hero-stage relative overflow-x-hidden text-white md:min-h-[720px]">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="hero-grain pointer-events-none absolute inset-0" />
        <SiteHeader business />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-2 px-5 pb-6 pt-20 md:min-h-[720px] md:grid-cols-2 md:gap-8 md:px-8 md:pb-12 md:pt-28">
          <div>
            <p className="hero-enter text-[12px] font-bold tracking-[0.16em] text-[#8FB0FF]">FLEET BUSINESS</p>
            <h1 className="hero-enter mt-3 text-[34px] font-extrabold leading-[1.02] tracking-[-0.045em] md:text-[68px]" style={{ animationDelay: '80ms' }}>
              Run your fleet. <span className="text-[#1F5BFF]">Every kwacha counted.</span>
            </h1>
            <p className="hero-enter mt-4 max-w-md text-[16px] leading-6 text-[#D5DCEC] md:text-[18px]" style={{ animationDelay: '160ms' }}>
              Today’s fares, the buses, and the conductors, on one desk.
            </p>
            <div id="hero-ctas" className="hero-enter mt-6 flex flex-wrap gap-3" style={{ animationDelay: '240ms' }}>
              <Link href="/business/signup" className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-5 text-[15px] font-bold text-white">Create a company</Link>
              <Link href="/business/login" className="inline-flex h-12 items-center rounded-xl bg-white/10 px-5 text-[15px] font-bold text-white ring-1 ring-white/25">Operator sign in</Link>
            </div>
          </div>
          <div className="hero-enter w-full min-w-0" style={{ animationDelay: '180ms' }}>
            <OperatorLaptop />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-4 px-5 py-10 md:grid-cols-2 md:px-8 md:py-14">
        <Reveal>
          <Link href="/business/login" className="flex h-full flex-col rounded-[20px] bg-[#1F5BFF] p-6 text-white">
            <span className="text-[13px] font-bold text-white/80">Sign in or create a company</span>
            <span className="mt-2 text-[28px] font-extrabold tracking-[-0.03em]">I&apos;m an operator</span>
            <span className="mt-3 text-[15px] leading-6 text-white/85">Open the desk for your buses, conductors, and today’s collections.</span>
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <Link href="/business/conductor/login" className="flex h-full flex-col rounded-[20px] bg-[#0B1B3B] p-6 text-white">
            <span className="text-[13px] font-bold text-white/70">Sign in</span>
            <span className="mt-2 text-[28px] font-extrabold tracking-[-0.03em]">I&apos;m a conductor</span>
            <span className="mt-3 text-[15px] leading-6 text-[#D5DCEC]">Use the phone number and PIN your operator gave you. No self sign-up.</span>
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-8 md:px-8 md:py-16">
        <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em] md:text-[40px]">What the desk actually does</h2></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-3">
            <article className="h-full rounded-[20px] bg-white p-6">
              <h3 className="text-[20px] font-extrabold">Collections as they are verified</h3>
              <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">The overview lists today’s earnings, rides, and the latest fares once a conductor accepts the code.</p>
            </article>
          </Reveal>
          <Reveal delay={60} className="md:col-span-3">
            <article className="h-full rounded-[20px] bg-white p-6">
              <h3 className="text-[20px] font-extrabold">Assign conductors to buses</h3>
              <p className="mt-2 text-[15px] leading-6 text-[#3E4A63]">One conductor, one bus, for the Lusaka day. That assignment is what the verify screen uses.</p>
            </article>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <article className="h-full rounded-[20px] bg-[#0B1B3B] p-6 text-white">
              <h3 className="text-[18px] font-extrabold">Codes that cannot be reused</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#D5DCEC]">A verified code is refused the next time. A code for another bus is refused too.</p>
            </article>
          </Reveal>
          <Reveal delay={140} className="md:col-span-2">
            <article className="h-full rounded-[20px] bg-white p-6">
              <h3 className="text-[18px] font-extrabold">Payouts and settlement</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#3E4A63]">Record a payout and mark a bus day settled. No fee is taken in this version.</p>
            </article>
          </Reveal>
          <Reveal delay={180} className="md:col-span-2">
            <article className="h-full rounded-[20px] bg-white p-6">
              <h3 className="text-[18px] font-extrabold">Lost & found desk</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#3E4A63]">Passenger reports land with the conductor, then show as ready for pickup.</p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
          <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em]">How it works for your fleet</h2></Reveal>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {FLOW.map((step, index) => (
              <Reveal key={step.n} delay={index * 70}>
                <li className="h-full list-none rounded-[20px] bg-[#F4F6FB] p-5">
                  <p className="text-[13px] font-extrabold text-[#1F5BFF]">{step.n}</p>
                  <h3 className="mt-2 text-[18px] font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#3E4A63]">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8">
        <Reveal>
          <p className="text-[12px] font-bold tracking-[0.16em] text-[#1F5BFF]">CONDUCTORS</p>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.04em]">A dark keypad for the person on the bus</h2>
          <p className="mt-3 text-[16px] leading-7 text-[#3E4A63]">They sign in with the account you created, see today’s bus, and type the passenger’s code. Wrong bus and used codes stop on that screen.</p>
          <Link href="/business/conductor/login" className="mt-5 inline-flex h-12 items-center rounded-xl bg-[#0B1B3B] px-5 text-[15px] font-bold text-white">Conductor sign in</Link>
        </Reveal>
        <Reveal delay={80}><KeypadMock /></Reveal>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 pb-8 md:grid-cols-2 md:px-8">
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-business.webp" alt="Two conductors beside a Lusaka bus" width={960} height={640} className="h-72 w-full rounded-[24px] object-cover md:h-80" />
        </Reveal>
        <Reveal delay={80}>
          <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">The people beside the bus</h2>
          <p className="mt-3 text-[16px] leading-7 text-[#3E4A63]">Operators stay on the desk. Conductors stay on the verify screen. Passengers stay in the rider app.</p>
          <Link href="/" className="mt-4 inline-block text-[15px] font-bold text-[#1F5BFF]">Passenger? Open Twende</Link>
        </Reveal>
      </section>

      <section id="faq" className="mx-auto max-w-[800px] px-5 py-16">
        <Reveal><h2 className="text-[32px] font-extrabold tracking-[-0.04em]">Questions</h2></Reveal>
        <div className="mt-6"><Faq items={FAQ} /></div>
      </section>

      <CtaBand title="Open the desk for your company." body="Create an operator account, then add the buses and the people who work them." href="/business/signup" label="Create a company" />
      <SiteFooter business />
      <StickyBar primary={{ href: '/business/signup', label: 'Create a company' }} secondary={{ href: '/business/login', label: 'Sign in' }} />
    </div>
  );
}
