import Image from 'next/image';
import Link from 'next/link';
import { blur } from '@/components/marketing/blur';
import { Laptop, Phone } from '@/components/marketing/devices';
import { jakarta } from '@/components/marketing/font';
import { SiteFooter, SiteHeader } from '@/components/marketing/chrome';
import { Still, StepRail } from '@/components/marketing/motion';
import { Faq, Reveal, StickyBar } from '@/components/marketing/ui';

export const metadata = { title: 'Twende Fleet Business' };

const FLOW = [
  { title: 'Add buses', body: 'Fleet number, plate, route, and the default fare.' },
  { title: 'Add conductors', body: 'You create the phone number and PIN. They do not sign themselves up.' },
  { title: 'Assign the day', body: 'One conductor on one bus. That is the only bus their codes will verify.' },
  { title: 'Watch fares come in', body: 'Verified tickets show on the desk as they happen.' },
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
    <div className={`${jakarta.variable} marketing bg-[#F7F8FB] text-[#0B1B3B]`}>
      <section data-hero className="relative h-[100svh] min-h-[640px] overflow-hidden text-white md:h-[88vh]">
        <div className="parallax-photo absolute inset-[-4%]">
          <Image
            src="/brand/campaign-business.jpg"
            alt="A fleet owner with a tablet in front of a row of minibuses"
            fill
            priority
            quality={85}
            placeholder="blur"
            blurDataURL={blur['campaign-business']}
            sizes="100vw"
            className="ken-burns object-cover object-[72%_center]"
          />
        </div>
        <div className="parallax-shade absolute inset-0 bg-gradient-to-t from-[#071230] via-[#071230]/75 to-[#071230]/25 md:bg-gradient-to-r md:from-[#071230] md:via-[#071230]/80 md:to-[#071230]/10" />
        <SiteHeader business />
        <div className="relative z-10 mx-auto grid h-full max-w-[1200px] grid-cols-12 items-end px-5 pb-24 md:items-center md:px-8 md:pb-0">
          <div className="col-span-12 md:col-span-7">
            <p className="line-reveal text-[13px] font-bold uppercase tracking-[0.14em] text-[#8FB0FF]">Fleet business</p>
            <h1 className="mt-4 text-[44px] md:text-[72px]">
              <span className="line-reveal block" style={{ animationDelay: '120ms' }}>Run your fleet.</span>
              <span className="line-reveal block text-[#4C7DFF] md:whitespace-nowrap" style={{ animationDelay: '260ms' }}>Every kwacha counted.</span>
            </h1>
            <p className="lead line-reveal mt-6 text-[#E7ECF8]" style={{ animationDelay: '400ms' }}>
              Today’s fares, the buses, and the conductors, on one desk.
            </p>
            <div id="hero-ctas" className="line-reveal mt-8 flex flex-wrap gap-3" style={{ animationDelay: '520ms' }}>
              <Link href="/business/signup" className="inline-flex h-[52px] items-center rounded-xl bg-[#1F5BFF] px-6 text-[15px] font-bold text-white">Create a company</Link>
              <Link href="/business/login" className="inline-flex h-[52px] items-center rounded-xl bg-white/10 px-6 text-[15px] font-bold text-white ring-1 ring-white/30">Operator sign in</Link>
            </div>
          </div>
        </div>
        <p className="parallax-glass card-rise glass absolute bottom-[24%] right-[14%] hidden rounded-2xl px-4 py-3 text-[14px] font-semibold text-white md:block">✓ Fare verified · Bus 12 · K5.00</p>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-32">
        <Reveal>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#1F5BFF]">The system</p>
          <h2 className="mt-4 max-w-[16ch] text-[32px] md:text-[48px]">The desk, and the conductor’s phone.</h2>
          <p className="lead mt-6 text-[#3E4A63]">Collections land on the operator desk the moment a conductor verifies the code.</p>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-12 rounded-[32px] bg-[radial-gradient(120%_90%_at_80%_0%,#8FB4FF_0%,#2457D6_46%,#071230_100%)] px-4 py-10 md:px-12 md:py-16">
            <div data-depth className="mock-float relative mx-auto max-w-[920px]">
              <Laptop src="/mockups/screen-desk.png" alt="Kalambata Transport operator dashboard on a laptop" />
              <div className="absolute bottom-[7%] right-[1%] z-10 w-[34%] max-w-[200px] md:w-[23%]">
                <Phone src="/mockups/screen-verify.png" alt="Conductor phone after a fare is verified" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-4 px-5 pb-20 md:grid-cols-2 md:px-8 md:pb-32">
        <Reveal>
          <Link href="/business/login" className="flex h-full gap-5 rounded-[24px] bg-white p-6 shadow-[0_16px_40px_rgba(11,27,59,0.06)] md:p-8">
            <Image src="/brand/campaign-business.jpg" alt="" width={224} height={224} quality={85} className="h-28 w-28 shrink-0 rounded-2xl object-cover object-[70%_center]" />
            <span>
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#1F5BFF]">Sign in or create a company</span>
              <span className="mt-2 block text-[28px] font-extrabold tracking-[-0.03em]">I&apos;m an operator</span>
              <span className="mt-2 block text-[15px] leading-6 text-[#3E4A63]">Open the desk for your buses, conductors, and today’s collections.</span>
            </span>
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <Link href="/business/conductor/login" className="flex h-full gap-5 rounded-[24px] bg-[#0B1B3B] p-6 text-white md:p-8">
            <Image src="/brand/moment-verify.jpg" alt="" width={224} height={224} quality={85} className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
            <span>
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#8FB0FF]">Sign in</span>
              <span className="mt-2 block text-[28px] font-extrabold tracking-[-0.03em]">I&apos;m a conductor</span>
              <span className="mt-2 block text-[15px] leading-6 text-[#D5DCEC]">Use the phone number and PIN your operator gave you.</span>
            </span>
          </Link>
        </Reveal>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-32">
          <Reveal><h2 className="text-[32px] md:text-[48px]">What the desk does</h2></Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-3"><article className="h-full rounded-[24px] bg-[#F4F6FB] p-8"><h3 className="text-[22px]">Collections as they are verified</h3><p className="mt-3 text-[16px] leading-[1.6] text-[#3E4A63]">Today’s earnings and the latest fares appear once a conductor accepts the code.</p></article></Reveal>
            <Reveal delay={60} className="md:col-span-3"><article className="h-full rounded-[24px] bg-[#F4F6FB] p-8"><h3 className="text-[22px]">Assign conductors to buses</h3><p className="mt-3 text-[16px] leading-[1.6] text-[#3E4A63]">One conductor, one bus, for the Lusaka day. That is what the verify screen uses.</p></article></Reveal>
            <Reveal delay={100} className="md:col-span-2"><article className="h-full rounded-[24px] bg-[#0B1B3B] p-8 text-white"><h3 className="text-[20px]">Codes that cannot be reused</h3><p className="mt-3 text-[16px] leading-[1.6] text-[#D5DCEC]">A verified code is refused the next time. A code for another bus is refused too.</p></article></Reveal>
            <Reveal delay={140} className="md:col-span-2"><article className="h-full rounded-[24px] bg-[#F4F6FB] p-8"><h3 className="text-[20px]">Payouts and settlement</h3><p className="mt-3 text-[16px] leading-[1.6] text-[#3E4A63]">Record a payout and mark a bus day settled. No fee is taken in this version.</p></article></Reveal>
            <Reveal delay={180} className="md:col-span-2"><article className="h-full rounded-[24px] bg-[#F4F6FB] p-8"><h3 className="text-[20px]">Lost & found desk</h3><p className="mt-3 text-[16px] leading-[1.6] text-[#3E4A63]">Passenger reports land with the conductor, then show as ready for pickup.</p></article></Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-32">
        <Reveal><h2 className="text-[32px] md:text-[48px]">How it works for your fleet</h2></Reveal>
        <StepRail>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-4">
            {FLOW.map((step, index) => (
              <li key={step.title}>
                <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-[#1F5BFF] text-[14px] font-extrabold text-white">{index + 1}</span>
                <h3 className="mt-4 text-[20px]">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-[1.6] text-[#3E4A63]">{step.body}</p>
              </li>
            ))}
          </ol>
        </StepRail>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-20 md:grid-cols-12 md:px-8 md:py-32">
          <Reveal className="md:col-span-6">
            <Still src="/brand/moment-verify.jpg" blur={blur['moment-verify']} alt="A passenger showing his phone to a smiling conductor" />
          </Reveal>
          <Reveal delay={80} className="md:col-span-6">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#1F5BFF]">Conductors</p>
            <h2 className="mt-4 text-[32px] md:text-[48px]">The person in the orange vest.</h2>
            <p className="lead mt-6 text-[#3E4A63]">They sign in with the account you created, see today’s bus, and type the code. Wrong bus and used codes stop on that screen.</p>
            <Link href="/business/conductor/login" className="mt-8 inline-flex h-[52px] items-center rounded-xl bg-[#0B1B3B] px-6 text-[15px] font-bold text-white">Conductor sign in</Link>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[800px] px-5 py-20 md:py-32">
        <Reveal><h2 className="text-[32px] md:text-[48px]">Questions</h2></Reveal>
        <div className="mt-6"><Faq items={FAQ} /></div>
      </section>

      <section className="relative overflow-hidden text-white">
        <Image src="/brand/campaign-business.jpg" alt="" fill quality={85} className="object-cover object-[72%_center]" sizes="100vw" />
        <div className="absolute inset-0 bg-[#071230]/78" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-5 py-20 md:px-8 md:py-32">
          <h2 className="max-w-xl text-[32px] md:text-[52px]">Open the desk for your company.</h2>
          <Link href="/business/signup" className="inline-flex h-[52px] items-center rounded-xl bg-[#1F5BFF] px-6 text-[15px] font-bold text-white">Create a company</Link>
        </div>
      </section>
      <SiteFooter business />
      <StickyBar primary={{ href: '/business/signup', label: 'Create a company' }} secondary={{ href: '/business/login', label: 'Sign in' }} />
    </div>
  );
}
