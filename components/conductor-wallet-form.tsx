'use client';

import { useActionState } from 'react';
import { saveConductorWalletAction } from '@/lib/actions';

export function ConductorWalletForm({ phone, network }: { phone: string; network: string | null }) {
  const [result, action, pending] = useActionState(saveConductorWalletAction, null);
  const control = 'mt-1 min-h-11 w-full rounded-xl border border-[#D5DCE8] bg-white px-3';
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-4">
      <h2 className="font-bold">Mobile-money wallet</h2>
      <p className="text-sm text-[#5C6578]">Your fleet operator uses this number to pay you.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Network
          <select name="network" required defaultValue={network ?? ''} className={control}>
            <option value="" disabled>Choose network</option>
            <option value="mtn">MTN MoMo</option>
            <option value="airtel">Airtel Money</option>
            <option value="zamtel">Zamtel Kwacha</option>
          </select>
        </label>
        <label className="text-sm font-semibold">Mobile-money number
          <input name="phone" type="tel" required defaultValue={phone} className={control} />
        </label>
      </div>
      <button disabled={pending} className="min-h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save wallet'}</button>
      {result ? <p role={result.ok ? 'status' : 'alert'} className="text-sm">{result.message}</p> : null}
    </form>
  );
}
