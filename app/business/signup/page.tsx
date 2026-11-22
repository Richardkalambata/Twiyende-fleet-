'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupOperatorAction } from '@/lib/actions';
import { buttonClass } from '@/components/shell';
import type { Fail } from '@/lib/types';

export default function BusinessSignup() {
  const [state, action, pending] = useActionState(signupOperatorAction, null as Fail | null);
  return (
    <main id="main" className="min-h-dvh w-full bg-[#F4F6FB] text-[#0B1B3B] lg:grid lg:items-center">
      <div className="safe-top w-full min-w-0 px-5 pb-10 sm:px-8 md:px-12 lg:px-[clamp(3rem,8vw,10rem)] lg:py-12">
        <p className="text-sm font-semibold text-[#1F5BFF]">Twende Fleet</p>
        <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.02em]">Open an operator account</h1>
        <form action={action} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
          <Field name="name" label="Your name" />
          <Field name="company" label="Company" />
          <Field name="phone" label="Phone" />
          <Field name="pin" label="6-digit PIN" />
          <label className="block text-sm font-medium">
            Payout network
            <select name="network" className="field mt-1.5" defaultValue="mtn">
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="zamtel">Zamtel</option>
            </select>
          </label>
          {state ? <p className="text-sm text-[#9A3B1A] md:col-span-2" role="alert">{state.message}</p> : null}
          <button className={buttonClass('green', 'md:col-span-2')} disabled={pending}>{pending ? 'Creating…' : 'Create fleet'}</button>
        </form>
        <Link href="/business/login" className="mt-4 block text-sm font-semibold text-[#1F5BFF]">I already have an account</Link>
      </div>
    </main>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} required type={name === 'pin' ? 'password' : name === 'phone' ? 'tel' : 'text'} inputMode={name === 'pin' ? 'numeric' : undefined} maxLength={name === 'pin' ? 6 : undefined} pattern={name === 'pin' ? '[0-9]{6}' : undefined} className="field mt-1.5" />
    </label>
  );
}
