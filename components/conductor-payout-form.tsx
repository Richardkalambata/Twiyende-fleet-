'use client';

import { useActionState, useRef, useState } from 'react';
import { recordConductorPayoutAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { ConductorOption } from '@/lib/types';

export function ConductorPayoutForm({ conductors, today, destinations }: { conductors: ConductorOption[]; today: string; destinations: { id: string; payout_phone: string | null; payout_network: string | null }[] }) {
  const [selected, setSelected] = useState('');
  const wallet = destinations.find((entry) => entry.id === selected);
  const ready = Boolean(wallet?.payout_phone && wallet.payout_network);
  const request = useRef<string | null>(null);
  const [result, action, pending] = useActionState(async (_previous: { ok: boolean; message: string } | null, data: FormData) => {
    request.current ??= crypto.randomUUID();
    data.set('requestId', request.current);
    try {
      const response = await recordConductorPayoutAction(null, data);
      request.current = null;
      return response;
    } catch {
      return { ok: false, message: 'Could not confirm the record. Retry with the same payout details.' };
    }
  }, null);
  const control = 'mt-1 min-h-11 w-full rounded-xl border border-[#D5DCE8] bg-white px-3';
  return (
    <section className="rounded-2xl bg-white p-4">
      <h2 className="font-bold">Record a conductor payout</h2>
      <p className="text-sm text-[#5C6578]">Send the payment through your mobile-money service first, then save its receipt reference in Twende.</p>
      {conductors.length ? (
        <form action={action} className="mt-3 space-y-3">
          <fieldset disabled={pending} className="grid min-w-0 gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">Conductor
              <select name="conductor" required value={selected} onChange={(event) => setSelected(event.target.value)} className={control}><option value="" disabled>Choose conductor</option>
                {conductors.map((person) => <option key={person.id} value={person.id}>{person.shortName} {person.busFleet ? `· Bus ${person.busFleet}` : ''}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Amount (K)<input name="amount" inputMode="decimal" required className={control} /></label>
            <label className="text-sm font-semibold">Date paid<input name="date" type="date" required defaultValue={today} max={today} className={control} /></label>
            <label className="text-sm font-semibold sm:col-span-3">Mobile-money receipt reference
              <input name="transferReference" required maxLength={80} className={control} />
            </label>
          </fieldset>
          {selected ? <p className="text-sm text-[#5C6578]">{ready && wallet?.payout_phone
            ? `Pay to ${wallet.payout_network?.toUpperCase()} · ${formatPhone(wallet.payout_phone)}`
            : 'Ask this conductor to save their mobile-money wallet first.'}</p> : null}
          <button disabled={pending || !ready} className="min-h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Record payout'}</button>
          {result ? <p role={result.ok ? 'status' : 'alert'} className="text-sm">{result.message}</p> : null}
        </form>
      ) : <p className="mt-2 text-sm">Add a conductor to record a payout.</p>}
    </section>
  );
}
