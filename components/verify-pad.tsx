'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAction } from '@/lib/actions';
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
      toast(result.message);
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
      <div className="safe-top flex min-h-full flex-col px-5 pb-6 text-[#0B1B3B]">
        <Logo business />
        <div className="mt-16 text-center">
          <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">No bus assigned today</h1>
          <p className="mt-2 text-[15px] text-[#5C6578]">Your operator needs to assign your bus before you can verify fares.</p>
        </div>
        <button type="button" disabled className="mt-auto h-12 rounded-xl bg-[#D5DCE8] font-bold text-white">Verify code</button>
        <button type="button" className="mt-3 h-12 rounded-xl bg-[#1F5BFF] font-bold text-white" onClick={() => router.refresh()}>Refresh assignment</button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="safe-top flex min-h-full flex-col px-5 pb-6 text-[#0B1B3B]">
        <Logo business />
        <div className="mt-8 rounded-2xl bg-[#0B1B3B] px-4 py-3 text-white">
          <p className="text-[11px] tracking-[0.12em] text-white/60">TODAY&apos;S BUS</p>
          <p className="text-[40px] font-extrabold leading-none">{fleetNumber}</p>
          <p className="text-[13px] text-white/70">{route} · {formatGrouped(amount)} · {rides} rides</p>
        </div>
        <div className="mt-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#12B76A] text-3xl text-white">✓</span>
          <p className="mt-4 text-[15px] text-[#5C6578]">Fare verified</p>
          <p className="text-[40px] font-extrabold tracking-[-0.04em]">{formatBalance(paid.amountNgwee)}</p>
          <p className="font-semibold">{paid.passenger}</p>
          <p className="mt-2 text-[13px] text-[#5C6578]">Code {code} · Bus {fleetNumber} · {formatHour24(paid.verifiedAt)}</p>
          <p className="mt-3 text-[14px] font-semibold">This code has now been used.</p>
        </div>
        <button type="button" className="mt-auto h-12 rounded-xl bg-[#1F5BFF] font-bold text-white" onClick={() => { setPaid(null); setCode(''); }}>Verify next code</button>
      </div>
    );
  }

  return (
    <div className="safe-top flex min-h-full flex-col px-5 pb-4 text-[#0B1B3B]">
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
