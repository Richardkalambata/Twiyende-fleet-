'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAction } from '@/lib/actions';
import { Bus, Check, RefreshCw } from 'lucide-react';
import { formatBalance, formatGrouped } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { Logo } from './shell';
import { toast } from './toast';

const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split('');

export function VerifyPad({
  fleetNumber,
  route,
  name,
  initialRides,
  initialAmount,
}: {
  fleetNumber: string | null;
  route?: string | null;
  name?: string;
  initialRides: number;
  initialAmount: number;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [letters, setLetters] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<{ amountNgwee: number; verifiedAt: number; passenger?: string } | null>(null);
  const [rides, setRides] = useState(initialRides);
  const [amount, setAmount] = useState(initialAmount);

  function push(char: string) {
    setError(null);
    setCode((current) => (current + char).slice(0, 4));
  }

  async function verify() {
    setPending(true);
    setError(null);
    const result = await verifyAction(code);
    setPending(false);
    if (!result.ok) {
      setPaid(null);
      setError(result.message);
      const dedicated = result.message.includes('This code is for Bus') || /already used|just used/i.test(result.message);
      if (!dedicated) toast(result.message);
      return;
    }
    setPaid({ amountNgwee: result.amountNgwee, verifiedAt: result.verifiedAt, passenger: result.passenger });
    setRides(result.todayRides);
    setAmount(result.todayNgwee);
    router.refresh();
  }

  const wrongBus = error?.includes('This code is for Bus');
  const used = error?.toLowerCase().includes('already used') || error?.toLowerCase().includes('just used');

  if (!fleetNumber) {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6 pt-4 text-[#0B1B3B]">
        <div className="flex items-center justify-between">
          <Logo business />
        </div>
        <div className="mt-16 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#E7EEFF] text-[#0B1B3B]"><Bus className="h-9 w-9" /></span>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.04em]">No bus assigned today</h1>
          <p className="mt-2 text-[15px] leading-6 text-[#5C6578]">Your operator needs to assign your bus before you can verify fares.</p>
        </div>
        <button type="button" disabled className="mt-auto h-12 rounded-xl bg-[#D5DCE8] font-bold text-white">Verify code</button>
        <button type="button" className="press mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1F5BFF] font-bold text-white" onClick={() => router.refresh()}><RefreshCw className="h-4 w-4" /> Refresh assignment</button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6 pt-4 text-[#0B1B3B]">
        <div className="rounded-2xl bg-[#0B1B3B] px-4 py-3 text-white">
          <p className="text-[11px] font-bold tracking-[0.14em] text-white/60">TODAY&apos;S BUS</p>
          <p className="num text-[44px] font-extrabold leading-none">{fleetNumber}</p>
          <p className="text-[13px] text-white/70">{route}</p>
        </div>
        <div className="mt-8 text-center">
          <span className="check-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#12B76A] text-white"><Check className="h-8 w-8" strokeWidth={2.5} /></span>
          <p className="mt-4 text-[15px] text-[#5C6578]">Fare verified</p>
          <p className="num text-[40px] font-extrabold tracking-[-0.04em]">{formatBalance(paid.amountNgwee)}</p>
          <p className="text-[16px] font-semibold">{paid.passenger}</p>
          <div className="mx-auto mt-4 grid max-w-[240px] grid-cols-3 gap-2 text-[12px] text-[#5C6578]">
            <span><span className="block text-[11px]">Code</span><span className="font-bold text-[#0B1B3B]">{code}</span></span>
            <span><span className="block text-[11px]">Bus</span><span className="font-bold text-[#0B1B3B]">{fleetNumber}</span></span>
            <span><span className="block text-[11px]">Time</span><span className="font-bold text-[#0B1B3B]">{formatHour24(paid.verifiedAt)}</span></span>
          </div>
          <p className="mt-4 text-[14px] font-semibold">This code has now been used.</p>
        </div>
        <button type="button" className="press mt-auto h-12 rounded-xl bg-[#1F5BFF] font-bold text-white" onClick={() => { setPaid(null); setCode(''); }}>Verify next code</button>
        <p className="mt-2 text-center text-[12px] text-[#8A93A6]">{formatGrouped(amount)} · {rides} rides today</p>
      </div>
    );
  }

  if (wrongBus || used) {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6 pt-4 text-[#0B1B3B]">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold">Hello, {name}</h1>
          <span className="rounded-full bg-[#E8F8EF] px-2 py-1 text-[12px] font-bold text-[#128A4E]">On shift</span>
        </div>
        <div className={`mt-8 rounded-2xl px-4 py-4 ${used ? 'bg-[#FFF6E8] text-[#9A5B00]' : 'bg-[#FDECEC] text-[#C53434]'}`}>
          <p className="text-[18px] font-extrabold">{used ? 'Code already used' : 'Wrong bus'}</p>
          <p className="mt-1 text-[14px] leading-5">{error}</p>
        </div>
        <p className="mt-6 text-center text-[32px] font-extrabold tracking-[0.18em]">{code}</p>
        <button type="button" className="press mt-8 h-12 rounded-xl bg-[#1F5BFF] font-bold text-white" onClick={() => { setError(null); setCode(''); }}>Enter another code</button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-4 pt-4 text-[#0B1B3B]">
      <div className="flex items-center justify-between">
        <Logo business />
        <span className="rounded-full bg-[#E8F8EF] px-2 py-1 text-[12px] font-bold text-[#128A4E]">On shift</span>
      </div>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-[-0.03em]">Hello, {name}</h1>
      <div className="mt-3 rounded-2xl bg-[#0B1B3B] px-4 py-3 text-white">
        <p className="text-[11px] tracking-[0.12em] text-white/60">TODAY&apos;S BUS</p>
        <div className="flex items-end justify-between">
          <p className="text-[40px] font-extrabold leading-none">{fleetNumber}</p>
          <p className="text-right text-[13px] text-white/70">{route}<br />{formatGrouped(amount)} · {rides} rides</p>
        </div>
      </div>
      <h2 className="mt-5 text-[20px] font-extrabold">Verify ride code</h2>
      <p className="text-[13px] text-[#5C6578]">Enter the code shown by the passenger.</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid h-16 place-items-center rounded-2xl bg-white text-[28px] font-extrabold">{code[index] ?? ''}</div>
        ))}
      </div>
      {wrongBus ? <p className="mt-3 rounded-xl bg-[#FDECEC] px-3 py-3 text-sm font-semibold text-[#C53434]" role="alert">{error}</p> : null}
      {used ? <p className="mt-3 rounded-xl bg-[#FFF6E8] px-3 py-3 text-sm font-semibold text-[#9A5B00]" role="alert">{error}</p> : null}
      {error && !wrongBus && !used ? <p className="mt-3 text-sm text-[#E5484D]" role="alert">{error}</p> : null}
      {letters ? (
        <div className="mt-3 grid grid-cols-6 gap-1">
          {LETTERS.map((letter) => (
            <button key={letter} type="button" className="h-10 rounded-lg bg-white text-sm font-bold" onClick={() => push(letter)}>{letter}</button>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['1','2','3','4','5','6','7','8','9'].map((digit) => (
            <button key={digit} type="button" className="h-11 rounded-xl bg-white font-bold" onClick={() => push(digit)}>{digit}</button>
          ))}
          <button type="button" className="h-11 rounded-xl bg-white text-xs font-bold" onClick={() => setLetters(true)}>ABC</button>
          <button type="button" className="h-11 rounded-xl bg-white font-bold" onClick={() => push('0')}>0</button>
          <button type="button" className="h-11 rounded-xl bg-white" aria-label="Delete" onClick={() => setCode((value) => value.slice(0, -1))}>⌫</button>
        </div>
      )}
      {letters ? <button type="button" className="mt-2 h-10 rounded-xl bg-white text-sm font-bold" onClick={() => setLetters(false)}>123</button> : null}
      <button type="button" disabled={pending || code.length < 4} onClick={verify} className="mt-3 h-12 rounded-xl bg-[#1F5BFF] font-bold text-white disabled:opacity-50">{pending ? 'Checking…' : 'Verify code'}</button>
      <p className="mt-2 text-center text-[12px] text-[#8A93A6]">Codes are valid once, on your assigned bus only.</p>
    </div>
  );
}
