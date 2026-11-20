'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payAction } from '@/lib/actions';
import { formatBalance, parseFare } from '@/lib/money';
import type { BusOption } from '@/lib/types';
import { Bus } from 'lucide-react';
import { toast } from './toast';

export function PayForm({ buses, balanceNgwee, onClose, initialFleet = '' }: { buses: BusOption[]; balanceNgwee: number; onClose?: () => void; initialFleet?: string }) {
  const router = useRouter();
  const [fleet, setFleet] = useState(initialFleet);
  const [fare, setFare] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const active = buses.filter((bus) => bus.status === 'active');
  const match = useMemo(() => active.find((bus) => bus.fleetNumber === fleet.trim().replace(/^bus\s*/i, '')), [active, fleet]);
  const configuredFares = match?.fareNgwee ?? [];
  const chips = (configuredFares.length ? configuredFares : [...new Set([match?.defaultFareNgwee ?? 500, 1000, 1500, 2000])])
    .map((value) => String(value / 100));
  const selectedFare = configuredFares.length && !chips.includes(fare) ? chips[0] : fare;
  const amount = parseFare(selectedFare) ?? 0;
  const short = Math.max(0, amount - balanceNgwee);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await payAction(fleet, selectedFare);
    if (!result.ok) {
      setError(result.message);
      toast(result.message);
      setPending(false);
      return;
    }
    router.push(`/receipt/${result.rideId}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F4F6FB] px-5 pb-8 text-[#0B1B3B]">
      <button type="button" className="safe-top text-left text-2xl" onClick={onClose} aria-label="Back">←</button>
      <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.04em]">Pay your fare</h1>
      <p className="text-[14px] text-[#5C6578]">Check the number on your bus.</p>
      <label className="mt-6 block text-[13px] text-[#5C6578]">
        Bus number
        <input value={fleet} onChange={(event) => setFleet(event.target.value)} inputMode="numeric" aria-label="Bus number" className="mt-1 w-full border-0 border-b-2 border-[#0B1B3B] bg-white py-1 text-[40px] font-extrabold tracking-[-0.04em] text-[#0B1B3B] outline-none placeholder:text-[#5C6578]" />
      </label>
      {match ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF2FF] text-[#1F5BFF]"><Bus className="h-5 w-5" /></span>
          <span><span className="block font-bold">Bus {match.fleetNumber}</span><span className="text-[13px] text-[#5C6578]">{match.route || 'Route not set'}</span></span>
        </div>
      ) : null}
      {configuredFares.length ? <p className="mt-6 text-[13px] font-semibold">Route fares (K)</p> : <label className="mt-6 block text-[13px] font-semibold">Fare amount (K)
        <input value={fare} onChange={(event) => setFare(event.target.value)} inputMode="decimal" aria-label="Custom fare" className="mt-2 w-full rounded-xl border border-[#D5DCE8] bg-white px-3 py-2 text-xl font-bold" />
      </label>}
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((value) => (
          <button key={value} type="button" data-on={selectedFare === value} onClick={() => setFare(value)} className={`chip press h-11 min-w-16 flex-1 rounded-xl text-[15px] font-bold ${selectedFare === value ? 'bg-[#1F5BFF] text-white' : 'border border-[#E4E8F0] bg-white text-[#0B1B3B]'}`}>K{value}</button>
        ))}
      </div>
      <div className="mt-6 space-y-2 text-[14px]">
        <div className="flex justify-between"><span className="text-[#5C6578]">Available</span><span className="font-semibold">{formatBalance(balanceNgwee)}</span></div>
        <div className="flex justify-between"><span className="text-[#5C6578]">After payment</span><span className="font-semibold">{formatBalance(balanceNgwee - amount)}</span></div>
      </div>
      <p className="num mt-4 text-center text-[44px] font-extrabold tracking-[-0.04em]">{formatBalance(amount)}</p>
      {short > 0 ? (
        <div className="mt-3 rounded-2xl bg-[#FFF6E8] px-4 py-3 text-[14px] text-[#9A5B00]">
          <p className="font-bold">Add {formatBalance(short)} to pay this fare.</p>
          <p className="mt-1">Your wallet has not been charged.</p>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[#E5484D]" role="alert">{error}</p> : null}
      {short > 0 ? (
        <a href="/topup" className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] font-bold text-white">Top up wallet</a>
      ) : (
        <button type="button" disabled={pending || !match || amount === 0} onClick={submit} className="glow-pay press mt-4 flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50">{pending ? 'Paying…' : `Pay ${formatBalance(amount)}`}</button>
      )}
      <p className="mt-2 text-center text-[12px] text-[#8A93A6]">Paid from your Twende wallet.</p>
    </div>
  );
}
