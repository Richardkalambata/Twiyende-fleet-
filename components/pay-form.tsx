'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payAction } from '@/lib/actions';
import { formatCompact, parseFare } from '@/lib/money';
import type { BusOption } from '@/lib/types';
import { BusIcon, QrIcon } from './icons';
import { buttonClass } from './shell';

export function PayForm({ buses }: { buses: BusOption[] }) {
  const router = useRouter();
  const [fleet, setFleet] = useState('');
  const [fare, setFare] = useState('5');
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
      setPending(false);
      return;
    }
    router.push(`/receipt/${result.rideId}`);
  }

  return (
    <div className="rounded-[28px] bg-white p-3 shadow-[0_10px_30px_rgba(20,36,28,0.05)]">
      <div className="flex h-14 items-center gap-2 rounded-2xl border border-[#E8E2D8] bg-white px-2">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E7F3EC] text-[#0B5D3B]">
          <BusIcon className="h-5 w-5" />
        </span>
        <input
          aria-label="Bus number"
          inputMode="numeric"
          placeholder="Bus number"
          value={fleet}
          onChange={(event) => setFleet(event.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A918C]"
        />
        <button type="button" className="grid h-11 w-11 place-items-center text-[#0B5D3B]" aria-label="Choose bus" onClick={() => setSheet(true)}>
          <QrIcon className="h-6 w-6" />
        </button>
      </div>
      {match ? <p className="px-2 pt-2 text-sm text-[#0B5D3B]">{match.route}</p> : null}
      <div className="mt-2 grid grid-cols-[1.4fr_0.8fr] gap-2">
        <label className="flex h-14 items-center rounded-2xl border border-[#E8E2D8] px-4 text-[#6A756E]">Fare (K)</label>
        <input
          aria-label="Fare in kwacha"
          inputMode="decimal"
          value={fare}
          onChange={(event) => setFare(event.target.value)}
          className="h-14 rounded-2xl border border-[#E8E2D8] bg-white px-4 text-center text-lg font-semibold outline-none"
        />
      </div>
      {error ? <p className="px-1 pt-3 text-sm text-[#9A3B1A]" role="alert">{error}</p> : null}
      <button type="button" className={`${buttonClass('copper')} mt-3`} disabled={pending} onClick={submit}>
        {pending ? 'Paying…' : label}
        <span aria-hidden>→</span>
      </button>
      {sheet ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Choose a bus">
          <div className="w-full max-w-[430px] rounded-3xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Which bus?</h2>
              <button type="button" className="h-11 px-2 text-sm" onClick={() => setSheet(false)}>Close</button>
            </div>
            <p className="mt-1 text-sm text-[#5C6B63]">Camera QR scan can plug in here. For now, choose the fleet number on the bus.</p>
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
                  <span className="text-sm text-[#5C6B63]">{bus.route}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
