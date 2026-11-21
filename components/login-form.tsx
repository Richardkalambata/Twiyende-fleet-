'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount } from '@/lib/types';
import { Logo } from './shell';
import { toast } from './toast';

export function LoginForm({ accounts, error, gate = 'passenger', operatorSmsRequired = false }: { accounts: DemoAccount[]; error?: string; operatorSmsRequired?: boolean; gate?: 'passenger' | 'operator' | 'conductor' | 'business' }) {
  const resolved = gate === 'business' ? 'operator' : gate;
  const [state, action, pending] = useActionState(loginAction, null);
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
    <main id="main" className="min-h-dvh w-full bg-[#F4F6FB] text-[#0B1B3B] lg:grid lg:items-center">
      <div className="flex w-full min-w-0 flex-col px-5 pb-6 sm:px-8 md:px-12 lg:px-[clamp(3rem,8vw,10rem)] lg:py-12">
        <div className="safe-top"><Logo business={resolved !== 'passenger'} /></div>
        <h1 className="mt-6 text-[clamp(26px,7vw,32px)] font-extrabold tracking-[-0.04em]">{title}</h1>
        <p className="mt-1 text-[15px] leading-5 text-[#5C6578]">{subtitle}</p>
        {state?.ok ? (
          <form action={action} className="mt-6 max-w-xl space-y-4">
            <p>Enter the six-digit code sent to your registered mobile number.</p>
            <label className="block">Verification code
              <input name="code" className="field mt-2" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required />
            </label>
            {message && <p role="alert">{message}</p>}
            <button disabled={pending} className="h-12 w-full rounded-xl bg-[#1F5BFF] font-bold text-white">Verify and sign in</button>
            <button type="button" onClick={() => window.location.reload()} className="font-semibold text-[#1F5BFF]">Restart sign-in</button>
          </form>
        ) : <form action={action} className="mt-6 grid w-full max-w-3xl gap-4">
          <label className="block text-[13px] font-medium text-[#5C6578]">
            Phone number
            <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="username" required className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578] focus:border-[#1F5BFF]" />
          </label>
          <label className="block text-[13px] font-medium text-[#5C6578]">
            Six-digit PIN
            <input name="pin" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="current-password" maxLength={6} pattern="[0-9]{6}" required className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[20px] font-semibold tracking-[0.4em] text-[#0B1B3B] outline-none focus:border-[#1F5BFF]" />
          </label>
          <input type="hidden" name="gate" value={resolved} />
          {message ? <p className="text-sm text-[#E5484D]" role="alert">{message}</p> : null}
          <button className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50" disabled={pending || pin.length !== 6}>
            {pending ? 'Signing in…' : 'Log in'}
          </button>
        </form>}
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
                <button type="submit" className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm text-[#0B1B3B]">
                  <span className="font-semibold">{account.shortName}</span>
                  <span className="text-[#5C6578]">{formatPhone(account.phone)}</span>
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

