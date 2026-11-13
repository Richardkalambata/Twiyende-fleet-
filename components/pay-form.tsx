'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payAction } from '@/lib/actions';
import { formatCompact, parseFare } from '@/lib/money';
import type { BusOption } from '@/lib/types';
import { BusIcon, QrIcon } from './icons';
import { toast } from './toast';

const PRESETS = ['5', '7', '10'] as const;

export function PayForm({ buses }: { buses: BusOption[] }) {
  const router = useRouter();
  const [fleet, setFleet] = useState('');
  const [fare, setFare] = useState('5');
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sheet, setSheet] = useState(false);
  const active = buses.filter((bus) => bus.status === 'active');
  const match = useMemo(() => active.find((bus) => bus.fleetNumber === fleet.trim().replace(/^bus\s*/i, '')), [active, fleet]);
  const amount = parseFare(fare);
  const label = amount ? `Pay ${formatCompact(amount)}` : 'Pay fare';

  async function submit() {
    setPending(true);
    setError(null);
    const result = await payAction(fleet, fare);
    if (!result.ok) {
      setError(result.message);
      toast(result.message);
      setPending(false);
      return;
    }
    router.push(`/receipt/${result.rideId}`);
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-card">
      <div className="flex h-[52px] items-center gap-2 rounded-xl bg-[#FBFAF6] px-2 shadow-[inset_0_0_0_1px_rgba(15,26,20,0.08)] focus-within:shadow-[0_0_0_3px_rgba(11,93,59,0.2)]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#E7F3EC] text-[#0B5D3B]">
          <BusIcon className="h-5 w-5" />
        </span>
        <input
          aria-label="Bus number"
          inputMode="numeric"
          placeholder="Bus number"
          value={fleet}
          onChange={(event) => setFleet(event.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#6B7570]"
        />
        <button type="button" className="grid h-11 w-11 place-items-center text-[#0B5D3B]" aria-label="Choose bus" onClick={() => setSheet(true)}>
          <QrIcon className="h-5 w-5" />
        </button>
      </div>
      {match ? <p className="px-2 pt-2 text-[13px] font-medium text-[#0B5D3B]">{match.route}</p> : null}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {PRESETS.map((value) => {
          const on = !custom && fare === value;
          return (
            <button key={value} type="button" onClick={() => { setCustom(false); setFare(value); }} className={`h-11 rounded-full text-[14px] font-semibold ${on ? 'bg-[#0B5D3B] text-white' : 'bg-[#F7F5F0] text-[#0F1A14]'}`}>
              K{value}
            </button>
          );
        })}
        <button type="button" onClick={() => setCustom(true)} className={`h-11 rounded-full text-[14px] font-semibold ${custom ? 'bg-[#0B5D3B] text-white' : 'bg-[#F7F5F0] text-[#0F1A14]'}`}>
          Other
        </button>
      </div>
      {custom ? (
        <label className="mt-2 block">
          <span className="sr-only">Fare in kwacha</span>
          <input
            aria-label="Fare in kwacha"
            inputMode="decimal"
            value={fare}
            onChange={(event) => setFare(event.target.value)}
            className="field"
            placeholder="Amount in kwacha"
          />
        </label>
      ) : null}
      {error ? <p className="px-1 pt-3 text-[14px] text-[#9A3B1A]" role="alert">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="mt-3 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#F4A15C] to-[#E8833A] text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(232,131,58,0.28)] transition duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? 'Paying…' : label}
        <span aria-hidden>→</span>
      </button>
      {sheet ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#0F1A14]/40 p-4" role="dialog" aria-modal="true" aria-label="Choose a bus">
          <div className="w-full max-w-[430px] rounded-[24px] bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold">Which bus?</h2>
              <button type="button" className="h-11 px-2 text-[14px]" onClick={() => setSheet(false)}>Close</button>
            </div>
            <p className="mt-1 text-[14px] text-[#6B7570]">Choose the fleet number painted on the bus.</p>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {active.map((bus) => (
                <button
                  key={bus.fleetNumber}
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-[#F7F5F0] px-4 text-left"
                  onClick={() => {
                    setFleet(bus.fleetNumber);
                    setSheet(false);
                  }}
                >
                  <span className="font-semibold">Bus {bus.fleetNumber}</span>
                  <span className="text-[13px] text-[#6B7570]">{bus.route}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
