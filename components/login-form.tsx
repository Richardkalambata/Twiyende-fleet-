'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { riderPaymentPath } from '@/lib/codes';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount } from '@/lib/types';
import { Logo } from './shell';
import { toast } from './toast';

function SignInButton({ label, loadingLabel = 'Signing in…', disabled = false, className }: { label: React.ReactNode; loadingLabel?: string; disabled?: boolean; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending} className={className}>
      {pending ? <span role="status" className="mx-auto inline-flex items-center gap-2"><LoaderCircle aria-hidden className="size-5 motion-safe:animate-spin" />{loadingLabel}</span> : label}
    </button>
  );
}

export function LoginForm({ accounts, error, gate = 'passenger', operatorSmsRequired = false, bus }: { accounts: DemoAccount[]; bus?: string; error?: string; operatorSmsRequired?: boolean; gate?: 'passenger' | 'operator' | 'conductor' | 'business' }) {
  const resolved = gate === 'business' ? 'operator' : gate;
  const [state, action] = useActionState(loginAction, null);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const message = state?.message ?? error;
  useEffect(() => { if (message) toast(message); }, [message]);


  const title = resolved === 'operator' ? 'Operator sign in' : resolved === 'conductor' ? 'Conductor sign in' : 'Welcome back.';
  const subtitle = resolved === 'operator'
    ? (operatorSmsRequired ? 'Enter your PIN, then verify the code sent to your phone.' : 'Sign in with your phone number and six-digit PIN.')
    : resolved === 'conductor'
      ? 'Use the phone number and PIN your operator gave you.'
      : 'Your next ride starts here.';

  return (
    <main id="main" className="grid min-h-dvh w-full grid-rows-[minmax(12rem,1fr)_auto] bg-[#F4F6FB] text-[#0B1B3B] md:grid-rows-[minmax(17rem,1fr)_auto] lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
      <header className="relative isolate flex min-w-0 flex-col justify-between overflow-hidden bg-[#0B1B3B] px-5 pb-7 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 md:px-12 md:pb-10 lg:px-[clamp(3rem,5vw,7rem)] lg:py-12">
        <Image
          src={resolved === 'passenger' ? '/images/brand/hero-rider-828.avif' : '/images/brand/hero-business-828.avif'}
          alt=""
          fill
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="-z-20 object-cover object-center"
          priority
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#07142D] via-[#07142D]/50 to-[#07142D]/65" />
        <div><Logo tone="light" business={resolved !== 'passenger'} /></div>
        <div className="mt-10 text-white lg:mt-auto">
          <h1 className="text-[clamp(2rem,5vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 md:text-base lg:text-lg">{subtitle}</p>
        </div>
      </header>
      <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-8 md:px-12 md:py-10 lg:px-[clamp(3rem,5vw,7rem)] lg:py-12">
        {state?.ok ? (
          <form action={action} className="space-y-4">
            <p>Enter the six-digit code sent to your registered mobile number.</p>
            <label className="block">Verification code
              <input name="code" className="field mt-2" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required />
            </label>
            {message && <p role="alert">{message}</p>}
            <SignInButton label="Verify and sign in" loadingLabel="Verifying code…" className="h-12 w-full rounded-xl bg-[#1F5BFF] font-bold text-white" />
            <button type="button" onClick={() => window.location.reload()} className="font-semibold text-[#1F5BFF]">Restart sign-in</button>
          </form>
        ) : <form action={action} className="grid w-full gap-5">
          <label className="block text-[13px] font-medium text-[#5C6578]">
            Phone number
            <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="username" required className="mt-2 min-h-12 w-full rounded-xl border border-[#D5DCE8] bg-white px-4 py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578] focus:border-[#1F5BFF]" />
          </label>
          <label className="block text-[13px] font-medium text-[#5C6578]">
            Six-digit PIN
            <input name="pin" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="current-password" maxLength={6} pattern="[0-9]{6}" required className="mt-2 min-h-12 w-full rounded-xl border border-[#D5DCE8] bg-white px-4 py-2 text-[20px] font-semibold tracking-[0.4em] text-[#0B1B3B] outline-none focus:border-[#1F5BFF]" />
          </label>
          <input type="hidden" name="gate" value={resolved} />
          {resolved === 'passenger' && riderPaymentPath(bus) && <input type="hidden" name="bus" value={bus} />}
          {message ? <p className="text-sm text-[#E5484D]" role="alert">{message}</p> : null}
          <SignInButton label="Log in" disabled={pin.length !== 6} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50 aria-busy:opacity-100" />
        </form>}
        {resolved === 'passenger' && riderPaymentPath(bus) && <Link href={`/signup?bus=${bus}`} className="mt-4 font-semibold text-[#1747CB]">Create a rider account</Link>}
        {resolved !== 'passenger' && <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold">
          {resolved === 'operator' ? (
            <>
              <Link href="/business/signup" className="block text-[#1F5BFF]">Create a company</Link>
              <Link href="/business/conductor/login" className="block text-[#5C6578]">Are you a conductor? Sign in here</Link>
            </>
          ) : null}
          {resolved === 'conductor' ? (
            <>
              <p className="font-medium text-[#5C6578]">No account? Ask your bus operator to add you.</p>
              <Link href="/business/login" className="block text-[#1F5BFF]">Are you the operator? Sign in here</Link>
            </>
          ) : null}
        </div>}
        {!state?.ok && accounts.length > 0 ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {accounts.slice(0, 3).map((account) => (
              <form key={account.id} action={demoLoginAction}>
                <input type="hidden" name="userId" value={account.id} />
                <input type="hidden" name="gate" value={resolved} />
                {resolved === 'passenger' && riderPaymentPath(bus) && <input type="hidden" name="bus" value={bus} />}
                <SignInButton className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm text-[#0B1B3B]" label={<>
                  <span className="font-semibold">{account.shortName}</span>
                  <span className="text-[#5C6578]">{formatPhone(account.phone)}</span>
                </>} />
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

