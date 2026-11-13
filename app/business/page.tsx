import Link from 'next/link';

export const metadata = { title: 'Twende Fleet Business' };

export default function BusinessHome() {
  return (
    <main className="min-h-dvh bg-[#F7F5F0] text-[#14241C]">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div>
          <div className="text-lg font-semibold leading-tight">Twende Fleet Business</div>
          <div className="text-xs tracking-[0.14em] text-[#6A756E]">OPERATORS & CONDUCTORS</div>
        </div>
        <div className="flex gap-2">
          <Link href="/business/login" className="inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold">Sign in</Link>
          <Link href="/business/signup" className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[#0B5D3B] px-4 text-sm font-semibold text-white">Start a fleet</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold text-[#E8833A]">Lusaka minibuses</p>
          <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight">Every fare, bus, and conductor in one desk.</h1>
          <p className="mt-4 max-w-md text-lg leading-7 text-[#5C6B63]">Passengers pay from their phones. Conductors confirm a code. You see the day’s takings before the bus is back at the stage.</p>
          <div className="mt-8 flex gap-3">
            <Link href="/business/signup" className="inline-flex h-14 items-center rounded-full bg-[#E8833A] px-6 font-semibold text-white">Create operator account</Link>
            <Link href="/business/login" className="inline-flex h-14 items-center rounded-full border border-[#D9D1C5] bg-white px-6 font-semibold">Sign in</Link>
          </div>
        </div>
        <div className="rounded-[28px] bg-[#0B5D3B] p-6 text-white shadow-[0_24px_60px_rgba(11,93,59,0.25)]">
          <p className="text-sm text-white/70">Today · Kalambata Transport</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">K 1,245</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <Stat label="Rides" value="249" />
            <Stat label="Buses" value="4" />
            <Stat label="Codes" value="Live" />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {[
          ['Assign the shift', 'Put a conductor on a bus for the day. They only see that bus.'],
          ['Confirm every fare', 'A code works once, and only on the bus the passenger paid.'],
          ['Pay out to mobile money', 'Send the day’s balance to MTN, Airtel, or Zamtel.'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(20,36,28,0.05)]">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5C6B63]">{body}</p>
          </article>
        ))}
      </section>
      <p className="pb-8 text-center text-sm text-[#6A756E]"><Link href="/" className="text-[#0B5D3B]">Rider app</Link> · Demo data, no real mobile money</p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="text-white/70">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
