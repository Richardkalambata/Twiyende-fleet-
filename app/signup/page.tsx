'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupPassengerAction } from '@/lib/actions';
import { buttonClass, Wordmark } from '@/components/shell';
import type { Fail } from '@/lib/types';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupPassengerAction, null as Fail | null);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col justify-center px-5 py-10">
      <Wordmark subtitle="Create a rider account" />
      <form action={action} className="mt-8 space-y-3">
        <Field name="name" label="Name" placeholder="Richard Kalambata" />
        <Field name="phone" label="Phone" placeholder="0971 000 001" inputMode="tel" />
        <Field name="pin" label="4-digit PIN" placeholder="1234" inputMode="numeric" maxLength={4} />
        <label className="block text-sm font-medium">
          Mobile money
          <select name="network" className="field mt-1.5" defaultValue="mtn">
            <option value="mtn">MTN</option>
            <option value="airtel">Airtel</option>
            <option value="zamtel">Zamtel</option>
          </select>
        </label>
        {state ? <p className="text-sm text-[#9A3B1A]" role="alert">{state.message}</p> : null}
        <button className={buttonClass('green')} disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
      </form>
      <Link href="/login" className="mt-4 text-center text-sm text-[#0B5D3B]">I already have an account</Link>
    </main>
  );
}

function Field(props: { name: string; label: string; placeholder: string; inputMode?: 'tel' | 'numeric'; maxLength?: number }) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <input name={props.name} placeholder={props.placeholder} inputMode={props.inputMode} maxLength={props.maxLength} className="field mt-1.5" />
    </label>
  );
}
