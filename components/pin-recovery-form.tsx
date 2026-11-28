'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { recoverPinAction } from '@/lib/pin-recovery-actions';
import type { Role } from '@/lib/types';
import { PinField } from './pin-field';

const field = 'field mt-2 min-h-12';

export function PinRecoveryForm({ role, bus, back, available }: {
  role: Role; bus?: string; back: string; available: boolean;
}) {
  const [state, action, pending] = useActionState(recoverPinAction.bind(null, role, bus), null);
  const [requestAgain, setRequestAgain] = useState(false);
  const resetting = state?.step === 'reset' && !requestAgain;

  return (
    <div className="space-y-4">
      {!available ? (
        <p className="text-sm text-[#5C6578]">SMS recovery is unavailable right now.</p>
      ) : (
        <form action={action} onSubmit={() => setRequestAgain(false)} className="grid gap-4">
          {resetting ? <>
            <p className="text-sm text-[#5C6578]">If the number matches an account, you’ll receive an SMS code.</p>
            <label className="block text-sm font-medium">SMS code
              <input name="code" autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required className={field} />
            </label>
            <PinField name="pin" label="New PIN" autoComplete="new-password" required className={field} labelClassName="text-sm font-medium" />
            <PinField name="confirm" label="Confirm new PIN" autoComplete="new-password" required className={field} labelClassName="text-sm font-medium" />
          </> : <>
            {requestAgain && <input type="hidden" name="restart" value="1" />}
            <label className="block text-sm font-medium">Registered phone number
              <input name="phone" type="tel" autoComplete="tel" maxLength={24} required className={field} />
            </label>
          </>}
          {!requestAgain && state?.message && <p role="alert" className="text-sm text-[#9A3B1A]">{state.message}</p>}
          <button type="submit" disabled={pending} aria-busy={pending} className="h-12 rounded-xl bg-[#1F5BFF] font-bold text-white disabled:opacity-60">
            {pending ? 'Please wait…' : resetting ? 'Reset PIN' : 'Send SMS code'}
          </button>
          {resetting && <button type="button" onClick={() => setRequestAgain(true)} disabled={pending} className="justify-self-start text-sm font-semibold text-[#1747CB]">Request a new code</button>}
        </form>
      )}
      <p className="text-sm text-[#5C6578]">{role === 'conductor' ? 'Need help? Contact your bus operator.' : <>
        Need help? <a href="https://modernmindsettechnologies.com/" className="font-semibold text-[#1747CB]">Contact Twende support</a>.
      </>}</p>
      <Link href={back} prefetch={false} className="block text-sm font-semibold text-[#1747CB]">Back to sign in</Link>
    </div>
  );
}
