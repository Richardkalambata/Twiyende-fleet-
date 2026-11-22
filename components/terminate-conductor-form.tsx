'use client';

import { useActionState } from 'react';
import { terminateConductorAction } from '@/lib/actions';

export function TerminateConductorForm({ conductorId, name }: { conductorId: string; name: string }) {
  const [state, action, pending] = useActionState(terminateConductorAction, null);
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-[#9C2929]">Terminate account</summary>
      <form action={action} className="mt-3 grid max-w-sm gap-3">
        <input type="hidden" name="conductorId" value={conductorId} />
        <p>{name} will lose bus assignments immediately and have 24 hours to review their account.</p>
        <label className="flex items-start gap-2">
          <input type="checkbox" name="confirm" required className="mt-1" /> Confirm account closure
        </label>
        {state && <p role="status">{state.message}</p>}
        <button disabled={pending} className="w-fit rounded-lg bg-[#9C2929] px-3 py-2 font-semibold text-white">
          {pending ? 'Saving…' : 'Terminate conductor'}
        </button>
      </form>
    </details>
  );
}
