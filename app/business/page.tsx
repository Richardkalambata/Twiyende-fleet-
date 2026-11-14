import Link from 'next/link';

export const metadata = { title: 'Twende Fleet Business' };

export default function BusinessHome() {
  return (
    <main className="min-h-dvh bg-[#F7F5F0] text-[#0F1A14]">
      <header className="safe-top mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 md:px-6">
        <div>
          <div className="text-[16px] font-semibold tracking-[-0.02em]">Twende Fleet Business</div>
          <div className="text-[11px] font-medium tracking-[0.14em] text-[#6B7570]">OPERATORS & CONDUCTORS</div>
        </div>
        <div className="flex gap-2">
          <Link href="/business/login" className="inline-flex h-11 items-center rounded-full px-4 text-[14px] font-semibold">Sign in</Link>
          <Link href="/business/signup" className="inline-flex h-11 items-center rounded-full bg-[#0B5D3B] px-4 text-[14px] font-semibold text-white">Start a fleet</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 md:px-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="text-[13px] font-semibold text-[#E8833A]">Lusaka minibuses</p>
          <h1 className="mt-3 max-w-xl text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[52px]">Every fare, on one desk.</h1>
          <p className="mt-4 max-w-md text-[16px] leading-6 text-[#3E4A44] md:text-[18px] md:leading-7">Passengers pay from their phones. Conductors confirm a code. You see the day’s takings before the bus is back at the stage.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/business/signup" className="inline-flex h-14 items-center rounded-full bg-[#0B5D3B] px-6 text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(7,61,39,0.18)]">Create operator account</Link>
            <Link href="/business/login" className="inline-flex h-14 items-center rounded-full bg-white px-6 text-[16px] font-semibold shadow-[inset_0_0_0_1px_rgba(15,26,20,0.08)]">Sign in</Link>
          </div>
        </div>
        <BrowserFrame />
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {[
          ['Assign the shift', 'Put a conductor on a bus for the day. They only see that bus.'],
          ['Confirm every fare', 'A code works once, and only on the bus the passenger paid.'],
          ['Pay out to mobile money', 'Send the day’s balance to MTN, Airtel, or Zamtel.'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="text-[18px] font-semibold">{title}</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#6B7570]">{body}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <blockquote className="rounded-[24px] bg-[#0A1F17] px-8 py-10 text-white">
          <p className="max-w-2xl text-[24px] font-medium leading-snug tracking-[-0.02em]">“I used to wait until the bus came back to count the cash. Now I see bus 12 while it is still in Matero.”</p>
          <footer className="mt-6 text-[14px] text-white/70">Richard Kalambata · Kalambata Transport</footer>
        </blockquote>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20 text-center">
        <h2 className="text-[32px] font-semibold tracking-[-0.02em]">Open the desk for your fleet.</h2>
        <Link href="/business/signup" className="mt-6 inline-flex h-14 items-center rounded-full bg-[#E8833A] px-6 text-[16px] font-semibold text-white">Start a fleet</Link>
        <p className="mt-6 text-[13px] text-[#6B7570]"><Link href="/" className="text-[#0B5D3B]">Rider app</Link> · Demo data, no real mobile money</p>
      </section>
    </main>
  );
}

function BrowserFrame() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(7,61,39,0.06),0_24px_64px_rgba(7,61,39,0.12)] ring-1 ring-[rgba(15,26,20,0.08)]">
      <div className="flex h-10 items-center gap-1.5 border-b border-[rgba(15,26,20,0.08)] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E7D5C4]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E7D5C4]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E7D5C4]" />
        <span className="ml-3 text-[12px] text-[#6B7570]">business.twende · Overview</span>
      </div>
      <div className="grid grid-cols-[140px_1fr]">
        <div className="bg-[#0A1F17] px-3 py-4 text-[12px] text-white/70">
          <div className="mb-4 font-semibold text-white">Twende</div>
          {['Overview', 'Buses', 'Conductors', 'Assignments', 'Payouts'].map((item, index) => (
            <div key={item} className={`mb-2 rounded-md px-2 py-1.5 ${index === 0 ? 'bg-white/10 text-white' : ''}`}>{item}</div>
          ))}
        </div>
        <div className="bg-[#F7F5F0] p-4">
          <div className="text-[18px] font-semibold">Good morning, Richard</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Mini label="Total today" value="K 1,245" />
            <Mini label="Rides" value="249" />
          </div>
          <div className="mt-3 h-24 rounded-xl bg-white p-3">
            <svg viewBox="0 0 240 70" className="h-full w-full" aria-hidden>
              <path d="M0 55 C 30 52, 50 30, 80 34 S 130 18, 160 22 210 40, 240 28" fill="none" stroke="#0B5D3B" strokeWidth="2.5" />
              <path d="M0 55 C 30 52, 50 30, 80 34 S 130 18, 160 22 210 40, 240 28 V 70 H 0 Z" fill="#0B5D3B" opacity="0.12" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-[11px] text-[#6B7570]">{label}</div>
      <div className="num mt-1 text-[18px] font-semibold">{value}</div>
    </div>
  );
}
