'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupOperatorAction } from '@/lib/actions';
import { buttonClass } from '@/components/shell';
import type { Fail } from '@/lib/types';

export default function BusinessSignup() {
  const [state, action, pending] = useActionState(signupOperatorAction, null as Fail | null);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center px-5 py-10">
      <p className="text-sm font-semibold text-[#E8833A]">Twende Fleet Business</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Open an operator account</h1>
      <form action={action} className="mt-8 space-y-3">
        <Field name="name" label="Your name" />
        <Field name="company" label="Company" />
        <Field name="phone" label="Phone" />
        <Field name="pin" label="4-digit PIN" />
        <label className="block text-sm font-medium">
          Payout network
          <select name="network" className="field mt-1.5" defaultValue="mtn">
            <option value="mtn">MTN</option>
            <option value="airtel">Airtel</option>
            <option value="zamtel">Zamtel</option>
          </select>
        </label>
        {state ? <p className="text-sm text-[#9A3B1A]" role="alert">{state.message}</p> : null}
        <button className={buttonClass('green')} disabled={pending}>{pending ? 'Creating…' : 'Create fleet'}</button>
      </form>
      <Link href="/business/login" className="mt-4 text-sm text-[#0B5D3B]">I already have an account</Link>
    </main>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} className="field mt-1.5" />
    </label>
  );
}
