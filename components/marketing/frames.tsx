import type { ReactNode } from 'react';

function PhoneFrame({ children, notch = true }: { children: ReactNode; notch?: boolean }) {
  return (
    <div className="relative rounded-[44px] bg-[#101a30] p-[9px] shadow-[0_28px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]">
      <span className="absolute left-[2px] top-[92px] h-7 w-[3px] rounded-full bg-[#2a3c60]" />
      <span className="absolute left-[2px] top-[132px] h-12 w-[3px] rounded-full bg-[#2a3c60]" />
      <span className="absolute right-[2px] top-[118px] h-16 w-[3px] rounded-full bg-[#2a3c60]" />
      <div className="relative overflow-hidden rounded-[36px] bg-[#F4F6FB] text-[#0B1B3B]">
        {notch ? <span className="absolute left-1/2 top-[7px] z-20 h-[16px] w-[68px] -translate-x-1/2 rounded-full bg-[#0B1B3B]" /> : null}
        <span className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(118deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.05)_28%,transparent_46%)]" />
        {children}
      </div>
    </div>
  );
}

function TicketScreen() {
  return (
    <div className="px-3 pb-3 pt-7">
      <div className="flex items-center justify-between text-[9px] font-semibold text-[#5C6578]">
        <span>9:41</span>
        <span>5G</span>
      </div>
      <p className="mt-2 text-[11px] font-extrabold">twende</p>
      <p className="mt-2 text-[13px] font-extrabold leading-tight">Your ride ticket</p>
      <div className="mt-2 rounded-xl bg-[#0B1B3B] px-2.5 py-2 text-white">
        <div className="flex items-center justify-between text-[11px] font-extrabold"><span>BUS 12</span><span>K5.00</span></div>
        <div className="mt-1.5 h-1 rounded-full bg-[#E8833A]" />
      </div>
      <p className="mt-3 text-center text-[26px] font-extrabold tracking-[0.16em]">EXJP</p>
      <p className="mt-1 text-center text-[9px] font-semibold text-[#3E4A63]">Show this code to your conductor</p>
      <p className="relative mx-auto mt-2 grid h-5 place-items-center">
        <span className="status-wait col-start-1 row-start-1 rounded-full bg-[#FFF6E8] px-2 py-0.5 text-[9px] font-bold text-[#9A5B00]">Awaiting verification</span>
        <span className="status-ok col-start-1 row-start-1 rounded-full bg-[#E8F8EF] px-2 py-0.5 text-[9px] font-bold text-[#0E7A45]">Verified ✓</span>
      </p>
      <div className="mt-2 space-y-1 border-t border-dashed border-[#E4E8F0] pt-2 text-[9px]">
        <div className="flex justify-between"><span className="text-[#5C6578]">Departure</span><span className="font-bold">Town</span></div>
        <div className="flex justify-between"><span className="text-[#5C6578]">Destination</span><span className="font-bold">Matero</span></div>
        <div className="flex justify-between"><span className="text-[#5C6578]">Fare paid</span><span className="font-bold">K5.00</span></div>
      </div>
    </div>
  );
}

function BalanceScreen() {
  return (
    <div className="px-3 pb-4 pt-8">
      <p className="text-[10px] text-[#5C6578]">Good evening,</p>
      <p className="text-[16px] font-extrabold">Richard</p>
      <div className="mt-2 rounded-2xl bg-[#0B1B3B] p-3 text-white">
        <p className="text-[9px] text-[#D5DCEC]">Available balance</p>
        <p className="text-[20px] font-extrabold">K120.00</p>
        <p className="text-[8px] text-[#D5DCEC]">Twende wallet · ZMW</p>
      </div>
      <div className="mt-2 h-8 rounded-xl bg-[#1F5BFF] text-center text-[11px] font-bold leading-8 text-white">Pay a fare</div>
    </div>
  );
}

export function RiderPhone() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[420px] md:h-[600px] md:max-w-[560px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,91,255,0.42),transparent_68%)] md:h-[520px] md:w-[520px]" />
      <div className="absolute left-[4%] top-[14%] w-[168px] opacity-95 md:left-[2%] md:w-[220px]" style={{ transform: 'perspective(900px) rotateY(16deg) rotateZ(-14deg)' }} aria-hidden>
        <PhoneFrame><BalanceScreen /></PhoneFrame>
      </div>
      <div className="absolute right-[2%] top-[2%] w-[230px] md:right-[4%] md:w-[300px]" style={{ transform: 'perspective(1000px) rotateY(-10deg) rotateZ(-8deg)' }}>
        <PhoneFrame><TicketScreen /></PhoneFrame>
      </div>
      <p className="float-card glass absolute left-0 top-[10%] z-20 rounded-2xl px-3 py-2 text-[12px] font-bold text-white">Verified ✓ Bus 12</p>
      <p className="float-card absolute right-0 top-[20%] z-20 rounded-2xl bg-white px-3 py-2 text-[13px] font-extrabold text-[#0B1B3B] shadow-[0_12px_30px_rgba(0,0,0,0.2)]" style={{ animationDelay: '0.6s' }}>K120.00 balance</p>
      <p className="float-card absolute left-[6%] top-[62%] z-20 rounded-2xl bg-[#1F5BFF] px-3 py-2 text-[12px] font-bold text-white" style={{ animationDelay: '1s' }}>Top up via MTN · Airtel · Zamtel</p>
    </div>
  );
}

function OverviewScreen() {
  const bars = [28, 40, 36, 62, 78, 70, 92];
  return (
    <div className="flex min-h-[210px] bg-[#F4F6FB] text-[#0B1B3B] md:min-h-[250px]">
      <div className="w-[78px] shrink-0 bg-[#0B1B3B] p-2 text-[9px] font-bold text-white/75">
        <p className="rounded-md bg-[#1F5BFF] px-1.5 py-1 text-white">Overview</p>
        <p className="mt-1 px-1.5 py-1">Buses</p>
        <p className="px-1.5 py-1">Conductors</p>
        <p className="px-1.5 py-1">Payouts</p>
      </div>
      <div className="min-w-0 flex-1 p-2.5">
        <p className="text-[12px] font-extrabold md:text-[14px]">Your fleet, at a glance.</p>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[
            ['Today', 'K1,250'],
            ['Rides', '250'],
            ['Buses', '4'],
            ['On shift', '4'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white px-1.5 py-1">
              <p className="text-[8px] text-[#5C6578]">{label}</p>
              <p className="text-[11px] font-extrabold md:text-[13px]">{value}</p>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 140 36" className="mt-2 h-12 w-full" aria-hidden>
          {bars.map((height, index) => (
            <rect key={index} x={index * 20 + 2} y={36 - height / 3} width="12" height={height / 3} rx="2" fill={index === bars.length - 1 ? '#1F5BFF' : '#8FB0FF'} />
          ))}
        </svg>
        <ul className="mt-1 space-y-1 text-[9px]">
          <li className="flex justify-between"><span>Richard · Bus 12</span><span className="font-bold text-[#0E7A45]">K5 Verified</span></li>
          <li className="flex justify-between"><span>Amina · Bus 15</span><span className="font-bold text-[#0E7A45]">K10 Verified</span></li>
        </ul>
      </div>
    </div>
  );
}

function MiniKeypad() {
  return (
    <div className="bg-[#071433] px-2 pb-3 pt-6 text-white">
      <p className="text-[8px] font-bold text-[#D5DCEC]">BUS</p>
      <p className="text-[22px] font-extrabold leading-none">12</p>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <span key={digit} className="grid h-5 place-items-center rounded bg-[#16305C] text-[8px] font-bold">{digit}</span>
        ))}
      </div>
    </div>
  );
}

export function OperatorLaptop() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-8">
      <div className="pointer-events-none absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,91,255,0.4),transparent_70%)] md:h-72 md:w-72" />
      <div className="relative">
        <div className="overflow-hidden rounded-t-[16px] border-[10px] border-[#0B1B3B] bg-[#0B1B3B] shadow-[0_28px_60px_rgba(0,0,0,0.4)]">
          <OverviewScreen />
        </div>
        <div className="mx-auto h-2 w-[94%] bg-[#1c2b4a]" />
        <div className="mx-auto h-3 w-[108%] -translate-x-[4%] rounded-b-2xl bg-[#0B1B3B] shadow-[0_10px_24px_rgba(0,0,0,0.35)]" />
      </div>
      <div className="absolute -bottom-2 right-[2%] z-10 w-[118px] md:w-[136px]" style={{ transform: 'perspective(700px) rotateZ(8deg)' }} aria-hidden>
        <PhoneFrame notch={false}><MiniKeypad /></PhoneFrame>
      </div>
      <p className="float-card absolute -left-1 top-[42%] z-20 rounded-2xl bg-white px-3 py-2 text-[12px] font-extrabold text-[#0B1B3B] shadow-[0_12px_30px_rgba(0,0,0,0.2)] md:-left-4">Bus 12 · K352 today</p>
      <p className="float-card absolute bottom-10 right-[28%] z-20 rounded-2xl bg-[#128A4E] px-3 py-2 text-[12px] font-bold text-white md:right-[24%]" style={{ animationDelay: '0.7s' }}>Code verified</p>
    </div>
  );
}

export function KeypadMock() {
  return (
    <div className="mx-auto w-[220px]" aria-hidden>
      <PhoneFrame notch={false}>
        <div className="bg-[#071433] px-3 pb-4 pt-5 text-white">
          <p className="text-[11px] font-bold text-[#D5DCEC]">TODAY&apos;S BUS</p>
          <p className="text-[36px] font-extrabold leading-none">12</p>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <span key={digit} className="grid h-8 place-items-center rounded-lg bg-[#16305C] text-[12px] font-bold">{digit}</span>
            ))}
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}
