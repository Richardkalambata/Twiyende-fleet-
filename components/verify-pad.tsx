'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAction } from '@/lib/actions';
import { formatBalance, formatGrouped } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { BusIcon, CheckIcon, ShieldIcon } from './icons';
import { buttonClass } from './shell';

const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split('');

export function VerifyPad({
  fleetNumber,
  initialRides,
  initialAmount,
}: {
  fleetNumber: string | null;
  initialRides: number;
  initialAmount: number;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [letters, setLetters] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<{ amountNgwee: number; verifiedAt: number } | null>(null);
  const [rides, setRides] = useState(initialRides);
  const [amount, setAmount] = useState(initialAmount);

  function push(char: string) {
    setError(null);
    setPaid(null);
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
      return;
    }
    setPaid({ amountNgwee: result.amountNgwee, verifiedAt: result.verifiedAt });
    setRides(result.todayRides);
    setAmount(result.todayNgwee);
    router.refresh();
  }

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-sm">
          <BusIcon className="h-4 w-4" /> Bus {fleetNumber ?? '—'}
        </span>
        <p className="text-right text-sm text-[#B7C2BA]">
          Today <span className="font-semibold text-[#1DB972]">{formatGrouped(amount).replace('K ', 'K ')}</span>
          <span> · {rides} rides</span>
        </p>
      </div>
      <h1 className="mt-5 text-[34px] font-semibold tracking-tight">Verify code</h1>
      <p className="mt-1 text-sm text-[#B7C2BA]">
        Enter the 4-character code from the passenger <span className="inline-block h-2 w-2 rounded-full bg-[#1DB972]" />
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Code">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`grid h-16 place-items-center rounded-2xl text-2xl font-semibold ${code[index] ? 'bg-[#24302B] text-white' : 'bg-[#1A2420] text-transparent'}`}>
            {code[index] ?? '·'}
          </div>
        ))}
      </div>
      {paid ? (
        <div className="paid-card mt-4 rounded-3xl px-5 py-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1DB972] text-[#062117]">
              <CheckIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-[#D7FFE9]">Paid</p>
              <p className="text-4xl font-semibold tracking-tight text-[#1DB972]">{formatBalance(paid.amountNgwee)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#D7FFE9]">Verified {formatHour24(paid.verifiedAt)} · code now used</p>
        </div>
      ) : null}
      {error ? <p className="mt-4 rounded-2xl border border-[#E8833A]/50 bg-[#3A2418] px-4 py-3 text-sm text-[#FFD7BF]" role="alert">{error}</p> : null}
      {letters ? (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {LETTERS.map((letter) => (
            <button key={letter} type="button" className="h-12 rounded-xl bg-[#1C2622] text-base font-semibold" onClick={() => push(letter)}>
              {letter}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button key={digit} type="button" className="h-14 rounded-2xl bg-[#1C2622] text-xl font-semibold active:bg-[#2A3832]" onClick={() => push(digit)}>
              {digit}
            </button>
          ))}
          <button type="button" className="h-14 rounded-2xl bg-[#1C2622] text-sm font-semibold" onClick={() => setLetters(true)}>ABC</button>
          <button type="button" className="h-14 rounded-2xl bg-[#1C2622] text-xl font-semibold" onClick={() => push('0')}>0</button>
          <button type="button" className="h-14 rounded-2xl bg-[#1C2622] text-xl" aria-label="Delete" onClick={() => setCode((current) => current.slice(0, -1))}>⌫</button>
        </div>
      )}
      {letters ? (
        <button type="button" className="mt-2 h-12 w-full rounded-2xl bg-[#1C2622] text-sm font-semibold" onClick={() => setLetters(false)}>123</button>
      ) : null}
      <button type="button" className={`${buttonClass('copper')} mt-4`} disabled={pending || !fleetNumber} onClick={verify}>
        <ShieldIcon className="h-5 w-5" /> {pending ? 'Checking…' : 'Verify'}
      </button>
      <p className="mt-4 text-center text-xs tracking-[0.16em] text-[#8B978F]">
        <span className="block text-sm font-semibold tracking-normal text-white/80">Twende Conductor</span>
        ZAMBIA MINIBUSES
      </p>
    </div>
  );
}
