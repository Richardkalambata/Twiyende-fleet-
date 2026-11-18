export function RiderPhone() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[440px] md:h-[480px]">
      <div className="absolute left-[22%] top-4 w-[180px] -rotate-6 md:left-[22%] md:top-8 md:w-[230px]" aria-hidden>
        <div className="rounded-[32px] border-8 border-[#0B1B3B] bg-[#0B1B3B] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="overflow-hidden rounded-[24px] bg-[#F4F6FB] p-3 text-[#0B1B3B]">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#5C6578]">RIDE TICKET</p>
            <div className="mt-2 rounded-xl bg-[#0B1B3B] px-3 py-2 text-white">
              <div className="flex items-center justify-between text-[12px] font-extrabold"><span>BUS 12</span><span>K5.00</span></div>
              <div className="mt-2 h-1 rounded-full bg-[#E8833A]" />
            </div>
            <p className="mt-3 text-center text-[28px] font-extrabold tracking-[0.18em]">EXJP</p>
            <p className="text-center text-[10px] font-semibold text-[#9A5B00]">Awaiting verification</p>
            <p className="mt-2 text-[11px] font-semibold text-[#3E4A63]">Town to Matero</p>
          </div>
        </div>
      </div>
      <p className="float-card glass absolute left-1 top-2 rounded-2xl px-3 py-2 text-[12px] font-bold text-white md:left-0 md:top-4">Verified ✓ Bus 12</p>
      <p className="float-card absolute right-1 top-24 rounded-2xl bg-white px-3 py-2 text-[13px] font-extrabold text-[#0B1B3B] shadow-[0_12px_30px_rgba(0,0,0,0.18)] md:right-2 md:top-28" style={{ animationDelay: '0.6s' }}>K120.00 balance</p>
      <p className="float-card absolute bottom-2 left-1 rounded-2xl bg-[#1F5BFF] px-3 py-2 text-[12px] font-bold text-white md:bottom-6 md:left-2" style={{ animationDelay: '1.1s' }}>Top up via MTN · Airtel · Zamtel</p>
    </div>
  );
}

export function OperatorLaptop() {
  return (
    <div className="relative mx-auto h-[260px] w-[min(100%,520px)] md:h-[340px]">
      <div className="absolute inset-x-0 top-6 overflow-hidden rounded-2xl border-8 border-[#0B1B3B] bg-[#F4F6FB] shadow-[0_24px_60px_rgba(0,0,0,0.35)]" aria-hidden>
        <div className="flex">
          <div className="w-[72px] shrink-0 bg-[#0B1B3B] p-2 text-[10px] font-bold text-white/80">
            <p className="rounded-md bg-[#1F5BFF] px-1 py-1 text-white">Overview</p>
            <p className="mt-1 px-1 py-1">Buses</p>
            <p className="px-1 py-1">Conductors</p>
          </div>
          <div className="min-w-0 flex-1 p-3 text-[#0B1B3B]">
            <p className="text-[12px] font-extrabold md:text-[14px]">Your fleet, at a glance.</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="rounded-lg bg-white p-2"><p className="text-[9px] text-[#5C6578]">Today</p><p className="text-[13px] font-extrabold">K1,250</p></div>
              <div className="rounded-lg bg-white p-2"><p className="text-[9px] text-[#5C6578]">Rides</p><p className="text-[13px] font-extrabold">250</p></div>
            </div>
            <div className="mt-2 h-10 rounded-lg bg-[linear-gradient(90deg,#E7EEFF,#1F5BFF)]" />
          </div>
        </div>
      </div>
      <p className="float-card absolute left-0 top-2 rounded-2xl bg-white px-3 py-2 text-[12px] font-extrabold text-[#0B1B3B] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">Bus 12 · K352 today</p>
      <p className="float-card absolute bottom-2 right-2 rounded-2xl bg-[#128A4E] px-3 py-2 text-[12px] font-bold text-white md:bottom-6" style={{ animationDelay: '0.8s' }}>Code verified</p>
    </div>
  );
}

export function KeypadMock() {
  return (
    <div className="mx-auto w-[220px] rounded-[28px] bg-[#071433] p-4 text-white shadow-[0_20px_50px_rgba(7,19,51,0.35)]" aria-hidden>
      <p className="text-[11px] font-bold text-[#D5DCEC]">TODAY&apos;S BUS</p>
      <p className="text-[36px] font-extrabold leading-none">12</p>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {['1','2','3','4','5','6','7','8','9'].map((digit) => (
          <span key={digit} className="grid h-8 place-items-center rounded-lg bg-[#16305C] text-[12px] font-bold">{digit}</span>
        ))}
      </div>
    </div>
  );
}
