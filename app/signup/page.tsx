'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupPassengerAction } from '@/lib/actions';
import { buttonClass, Wordmark } from '@/components/shell';
import type { Fail } from '@/lib/types';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupPassengerAction, null as Fail | null);
  return (
    <main id="main" className="min-h-dvh w-full bg-[#F4F6FB] text-[#0B1B3B] lg:grid lg:items-center">
      <div className="safe-top mx-auto w-full max-w-xl px-5 pb-10 md:px-10 lg:py-12">
        <Wordmark />
        <h1 className="mt-8 text-[32px] font-extrabold leading-none tracking-[-0.04em]">Let&apos;s get moving.</h1>
        <p className="mt-2 text-[15px] text-[#5C6578]">Create your passenger account.</p>
        <form action={action} className="mt-6 space-y-4">
          <Field name="name" label="Name" placeholder="Richard Banda" />
          <Field name="phone" label="Phone" placeholder="0971 000 001" inputMode="tel" />
          <Field name="pin" label="6-digit PIN" placeholder="••••••" inputMode="numeric" maxLength={6} />
          <Field name="confirm" label="Confirm PIN" placeholder="••••••" inputMode="numeric" maxLength={6} />
          <label className="flex items-start gap-3 text-[14px] leading-5">
            <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-[#1F5BFF]" />
            <span>I agree to the terms</span>
          </label>
          <label className="block text-[13px] font-medium text-[#5C6578]">
            Mobile money
            <select name="network" className="mt-1 h-12 w-full rounded-xl bg-white px-3 text-[16px] font-semibold text-[#0B1B3B]" defaultValue="mtn">
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="zamtel">Zamtel</option>
            </select>
          </label>
          {state ? <p className="text-sm text-[#E5484D]" role="alert">{state.message}</p> : null}
          <button className={buttonClass('green')} disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
        </form>
        <Link href="/login" className="mt-4 text-center text-[14px] font-semibold text-[#1F5BFF]">I already have an account</Link>
      </div>
    </main>
  );
}

function Field(props: { name: string; label: string; placeholder: string; inputMode?: 'tel' | 'numeric'; maxLength?: number }) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <input name={props.name} type={props.maxLength ? "password" : props.inputMode === "tel" ? "tel" : "text"} autoComplete={props.maxLength ? "new-password" : undefined} pattern={props.maxLength ? "[0-9]{6}" : undefined} required placeholder={props.placeholder} inputMode={props.inputMode} maxLength={props.maxLength} className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578] focus:border-[#1F5BFF]" />
    </label>
  );
}
