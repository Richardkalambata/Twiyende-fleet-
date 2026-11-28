'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupPassengerAction } from '@/lib/actions';
import { buttonClass, Wordmark } from '@/components/shell';
import { PinField } from './pin-field';
import type { Fail } from '@/lib/types';

export function PassengerSignup({ bus }: { bus?: string }) {
  const [state, action, pending] = useActionState(signupPassengerAction, null as Fail | null);
  return (
    <main id="main" className="min-h-dvh w-full bg-[#F4F6FB] text-[#0B1B3B] lg:grid lg:items-center">
      <div className="safe-top w-full min-w-0 px-5 pb-10 sm:px-8 md:px-12 lg:px-[clamp(3rem,8vw,10rem)] lg:py-12">
        <Wordmark />
        <h1 className="mt-8 text-[32px] font-extrabold leading-none tracking-[-0.04em]">Let&apos;s get moving.</h1>
        <p className="mt-2 text-[15px] text-[#5C6578]">Create your passenger account.</p>
        <form action={action} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6">
          {bus && <input type="hidden" name="bus" value={bus} />}
          <Field name="name" label="Name" placeholder="Richard Banda" />
          <Field name="phone" label="Phone" placeholder="0971 000 001" inputMode="tel" />
          <PinField name="pin" label="6-digit PIN" autoComplete="new-password" required className="field mt-1 min-h-12" labelClassName="text-sm font-medium" />
          <PinField name="confirm" label="Confirm PIN" autoComplete="new-password" required className="field mt-1 min-h-12" labelClassName="text-sm font-medium" />
          <label className="flex items-start gap-3 text-[14px] md:col-span-2 leading-5">
            <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-[#1F5BFF]" />
            <span>I agree to the terms</span>
          </label>
          <label className="block text-[13px] font-medium md:col-span-2 text-[#5C6578]">
            Mobile money
            <select name="network" className="mt-1 h-12 w-full rounded-xl bg-white px-3 text-[16px] font-semibold text-[#0B1B3B]" defaultValue="mtn">
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="zamtel">Zamtel</option>
            </select>
          </label>
          {state ? <p className="text-sm text-[#E5484D] md:col-span-2" role="alert">{state.message}</p> : null}
          <button className={buttonClass('green', 'md:col-span-2')} disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
        </form>
        <Link href={bus ? `/login?bus=${bus}` : '/login'} className="mt-4 block text-center text-[14px] font-semibold text-[#1F5BFF]">I already have an account</Link>
      </div>
    </main>
  );
}

function Field(props: { name: string; label: string; placeholder: string; inputMode?: 'tel' }) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <input name={props.name} type={props.inputMode === "tel" ? "tel" : "text"} required placeholder={props.placeholder} inputMode={props.inputMode} className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578] focus:border-[#1F5BFF]" />
    </label>
  );
}
