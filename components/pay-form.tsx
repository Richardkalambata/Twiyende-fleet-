'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { normalizeFleetNumber } from '@/lib/codes';
import { useRouter } from 'next/navigation';
import { payAction } from '@/lib/actions';
import { formatBalance, parseFare } from '@/lib/money';
import type { BusOption } from '@/lib/types';
import { Bus, ScanLine } from 'lucide-react';
import { toast } from './toast';

const BusQrScanner = dynamic(() => import('./bus-qr-scanner').then((module) => module.BusQrScanner), {
  loading: () => <p className="mt-3 text-sm" role="status">Starting camera…</p>,
});

type Attempt = { number: string; amount: number; id: string };
type RiderScannerWindow = Window & { twendeRiderScanner?: { postMessage: (request: string) => void } };

export function PayForm({ balanceNgwee, initialBus, initialFleet, riderId, publicOrigin }: {
  balanceNgwee: number; initialBus: BusOption | null; initialFleet: string; riderId: string; publicOrigin?: string;
}) {
  const router = useRouter();
  const [fleet, setFleet] = useState(initialFleet);
  const [fare, setFare] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lookup, setLookup] = useState<{ number: string; bus: BusOption | null; failed?: boolean } | null>(
    initialFleet ? { number: initialFleet, bus: initialBus } : null,
  );
  const inFlight = useRef(false);
  const request = useRef<Attempt | null>(null);
  const number = normalizeFleetNumber(fleet);
  const validNumber = /^\d{1,4}$/.test(number);
  const matched = lookup?.number === number ? lookup : null;
  const match = matched?.bus;

  const selectScannedBus = useCallback((scanned: string) => {
    setFleet(scanned);
    setFare('');
    setError(null);
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    if (!validNumber || matched) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/fare-bus?number=${number}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Bus lookup failed');
        const { bus } = await response.json() as { bus: BusOption | null };
        if (!controller.signal.aborted) setLookup({ number, bus });
      } catch {
        if (!controller.signal.aborted) setLookup({ number, bus: null, failed: true });
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [number, validNumber, matched]);
  function openScanner() {
    const nativeScanner = (window as RiderScannerWindow).twendeRiderScanner;
    if (typeof nativeScanner?.postMessage === 'function') {
      nativeScanner.postMessage('scan');
    } else {
      setScannerOpen(true);
    }
  }

  const configuredFares = match?.fareNgwee ?? [];
  const chips = (configuredFares.length ? configuredFares : [...new Set([match?.defaultFareNgwee ?? 500, 1000, 1500, 2000])])
    .map((value) => String(value / 100));
  const selectedFare = configuredFares.length && !chips.includes(fare) ? chips[0] : fare;
  const amount = parseFare(selectedFare) ?? 0;
  const short = Math.max(0, amount - balanceNgwee);

  async function submit() {
    if (inFlight.current || scannerOpen || !match || !amount) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    const storageKey = `twende-fare-attempt:${riderId}`;
    let prior = request.current;
    try {
      prior ??= JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Attempt | null;
    } catch { /* The in-memory key also protects retries. */ }
    const id = prior?.number === number && prior.amount === amount && typeof prior.id === 'string'
      ? prior.id : crypto.randomUUID();
    request.current = { number, amount, id };
    try { sessionStorage.setItem(storageKey, JSON.stringify(request.current)); } catch { /* Storage may be disabled. */ }
    try {
      const result = await payAction(number, selectedFare, id);
      request.current = null;
      try { sessionStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
      if (result.ok) {
        router.replace(`/receipt/${result.rideId}`);
        return;
      }
      setError(result.message);
      toast(result.message);
    } catch {
      setError('We could not confirm the payment. Retry this same fare to check its result without paying twice.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F4F6FB] px-5 pb-8 text-[#0B1B3B]">
      <Link href="/home" prefetch={false} className="safe-top text-left text-2xl" aria-label="Back">←</Link>
      <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.04em]">Pay your fare</h1>
      <p className="text-[14px] text-[#5C6578]">Scan the QR code on the bus sign or enter its number.</p>
      {!scannerOpen ? (
        <button type="button" disabled={pending} onClick={openScanner} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#D5DCE8] bg-white px-4 text-sm font-bold text-[#1747CB] disabled:opacity-50">
          <ScanLine aria-hidden="true" className="h-5 w-5" /> Scan bus QR code
        </button>
      ) : (
        <BusQrScanner publicOrigin={publicOrigin} onRead={selectScannedBus} onClose={() => setScannerOpen(false)} />
      )}
      <label className="mt-6 block text-[13px] text-[#5C6578]">
        Bus number
        <input value={fleet} disabled={pending} onChange={(event) => { setFleet(event.target.value); setFare(''); setError(null); setScannerOpen(false); }} inputMode="numeric" aria-label="Bus number" className="mt-1 w-full border-0 border-b-2 border-[#0B1B3B] bg-white py-1 text-[40px] font-extrabold tracking-[-0.04em] text-[#0B1B3B] outline-none placeholder:text-[#5C6578]" />
      </label>
      {match ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF2FF] text-[#1F5BFF]"><Bus className="h-5 w-5" /></span>
          <span><span className="block font-bold">Bus {match.fleetNumber}</span><span className="text-[13px] text-[#5C6578]">{match.route || 'Route not set'}</span></span>
        </div>
      ) : validNumber && !matched ? <p role="status" className="mt-3 text-sm">Checking Bus {number}…</p>
        : matched?.failed ? <p role="status" className="mt-3 text-sm">Could not check this bus. <button type="button" className="font-bold text-[#1747CB]" onClick={() => setLookup(null)}>Retry</button></p>
        : validNumber ? <p className="mt-3 text-sm">This bus is unavailable. Check the number on the vehicle.</p> : null}
      {configuredFares.length ? <p className="mt-6 text-[13px] font-semibold">Route fares (K)</p> : <label className="mt-6 block text-[13px] font-semibold">Fare amount (K)
        <input value={fare} disabled={pending} onChange={(event) => setFare(event.target.value)} inputMode="decimal" aria-label="Custom fare" className="mt-2 w-full rounded-xl border border-[#D5DCE8] bg-white px-3 py-2 text-xl font-bold" />
      </label>}
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((value) => (
          <button key={value} type="button" disabled={pending} data-on={selectedFare === value} onClick={() => setFare(value)} className={`chip press h-11 min-w-16 flex-1 rounded-xl text-[15px] font-bold ${selectedFare === value ? 'bg-[#1F5BFF] text-white' : 'border border-[#E4E8F0] bg-white text-[#0B1B3B]'}`}>K{value}</button>
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
        <button type="button" disabled={pending || scannerOpen || !match || amount === 0} onClick={submit} className="glow-pay press mt-4 flex h-12 items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50">{pending ? 'Paying…' : `Pay ${formatBalance(amount)}`}</button>
      )}
      <p className="mt-2 text-center text-[12px] text-[#8A93A6]">Paid from your Twende wallet.</p>
    </div>
  );
}
