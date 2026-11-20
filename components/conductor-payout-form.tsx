'use client';

import { useActionState, useRef } from 'react';
import { recordConductorPayoutAction } from '@/lib/actions';
import type { ConductorOption } from '@/lib/types';

export function ConductorPayoutForm({ conductors, today }: { conductors: ConductorOption[]; today: string }) {
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
      <p className="text-sm text-[#5C6578]">Record money you’ve already paid to a conductor.</p>
      {conductors.length ? (
        <form action={action} className="mt-3 space-y-3">
          <fieldset disabled={pending} className="grid min-w-0 gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">Conductor
              <select name="conductor" required defaultValue="" className={control}><option value="" disabled>Choose conductor</option>
                {conductors.map((person) => <option key={person.id} value={person.id}>{person.shortName} {person.busFleet ? `· Bus ${person.busFleet}` : ''}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Amount (K)<input name="amount" inputMode="decimal" required className={control} /></label>
            <label className="text-sm font-semibold">Date paid<input name="date" type="date" required defaultValue={today} max={today} className={control} /></label>
          </fieldset>
          <button disabled={pending} className="min-h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Record payout'}</button>
          {result ? <p role={result.ok ? 'status' : 'alert'} className="text-sm">{result.message}</p> : null}
        </form>
      ) : <p className="mt-2 text-sm">Add a conductor to record a payout.</p>}
    </section>
  );
}
