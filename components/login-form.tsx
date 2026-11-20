'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount } from '@/lib/types';
import { Logo } from './shell';
import { toast } from './toast';

const signInRoles = [
  { role: 'passenger', label: 'Rider', href: '/login' },
  { role: 'conductor', label: 'Conductor', href: '/business/conductor/login' },
  { role: 'operator', label: 'Operator', href: '/business/login' },
] as const;

export function LoginForm({ accounts, error, gate = 'passenger', operatorSmsRequired = false }: { accounts: DemoAccount[]; error?: string; operatorSmsRequired?: boolean; gate?: 'passenger' | 'operator' | 'conductor' | 'business' }) {
  const resolved = gate === 'business' ? 'operator' : gate;
  const [state, action, pending] = useActionState(loginAction, null);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [legacy, setLegacy] = useState(false);
  const pinLength = legacy ? 4 : 6;
  const message = state?.message ?? error;
  useEffect(() => { if (message) toast(message); }, [message]);


  const title = resolved === 'operator' ? 'Operator sign in' : resolved === 'conductor' ? 'Conductor sign in' : 'Welcome back.';
  const subtitle = resolved === 'operator'
    ? (operatorSmsRequired ? 'Enter your PIN, then verify the code sent to your phone.' : 'Sign in with your phone number and six-digit PIN.')
    : resolved === 'conductor'
      ? 'Use the phone number and PIN your operator gave you.'
      : 'Your next ride starts here.';

  return (
    <main className="min-h-dvh bg-[#F4F6FB] text-[#0B1B3B] lg:grid lg:grid-cols-[minmax(280px,34%)_minmax(0,1fr)]" id="main">
      <aside className="hidden flex-col bg-[#0B1B3B] px-10 py-12 text-white lg:flex xl:px-16">
        <Link href="/" className="self-start"><Logo tone="light" /></Link>
        <nav aria-label="Sign-in roles" className="mt-20 w-full max-w-xs space-y-2">
          {signInRoles.map(({ role, label, href }) => (
            <Link
              key={role}
              href={href}
              aria-current={resolved === role ? 'page' : undefined}
              className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-[current=page]:bg-white aria-[current=page]:text-[#0B1B3B]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 items-center justify-center px-5 pb-6 md:px-12 lg:p-12">
        <div className="flex w-full max-w-xl flex-col lg:rounded-[28px] lg:border lg:border-[#DCE3EF] lg:bg-white lg:p-10 xl:p-12">
          <div className="safe-top lg:hidden"><Logo business={resolved !== 'passenger'} /></div>
          <h1 className="mt-6 text-[clamp(26px,7vw,32px)] font-extrabold tracking-[-0.04em] lg:mt-0 lg:text-[40px]">{title}</h1>
          <p className="mt-1 text-[15px] leading-5 text-[#5C6578]">{subtitle}</p>
          {state?.ok ? (
            <form action={action} className="mt-6 space-y-4">
              <p>Enter the six-digit code sent to your registered mobile number.</p>
              <label className="block">Verification code
                <input name="code" className="field mt-2" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required />
              </label>
              {message && <p role="alert">{message}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-[#1F5BFF] font-bold text-white">Verify and sign in</button>
              <button type="button" onClick={() => window.location.reload()} className="font-semibold text-[#1F5BFF]">Restart sign-in</button>
            </form>
          ) : <form action={action} className="mt-6">
            <label className="block text-[13px] font-medium text-[#5C6578]">
              Phone number
              <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="username" required className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578] focus:border-[#1F5BFF] lg:min-h-12 lg:rounded-xl lg:border lg:px-4" />
            </label>
            <label className="mt-5 block text-[13px] font-medium text-[#5C6578]">
              {legacy ? 'Old four-digit PIN' : 'Six-digit PIN'}
              <input name="pin" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, pinLength))} inputMode="numeric" autoComplete="current-password" maxLength={pinLength} pattern={`[0-9]{${pinLength}}`} required className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[20px] font-semibold tracking-[0.4em] text-[#0B1B3B] outline-none focus:border-[#1F5BFF] lg:min-h-12 lg:rounded-xl lg:border lg:px-4" />
            </label>
            {legacy && <label className="mt-4 block">New six-digit PIN
              <input name="nextPin" type="password" className="field mt-2" inputMode="numeric" autoComplete="new-password" maxLength={6} pattern="[0-9]{6}" required />
            </label>}
            <input type="hidden" name="legacy" value={legacy ? 'yes' : 'no'} />
            <button type="button" className="mt-3 text-sm font-semibold text-[#1F5BFF]" onClick={() => { setLegacy(!legacy); setPin(''); }}>{legacy ? 'Use my six-digit PIN' : 'Upgrade my old four-digit PIN'}</button>
            <input type="hidden" name="gate" value={resolved} />
            {message ? <p className="mt-3 text-sm text-[#E5484D]" role="alert">{message}</p> : null}
            <button className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50" disabled={pending || pin.length !== pinLength}>
              {pending ? 'Signing in…' : 'Log in'}
            </button>
          </form>}
          <div className="mt-4 space-y-2 text-center text-[13px] font-semibold">
            {resolved === 'passenger' ? <Link href="/business/login" className="block text-[#1F5BFF] lg:hidden">Operator sign in</Link> : null}
            {resolved === 'passenger' ? <Link href="/business/conductor/login" className="block text-[#5C6578] lg:hidden">Conductor sign in</Link> : null}
            {resolved === 'operator' ? (
              <>
                <Link href="/business/signup" className="block text-[#1F5BFF]">Create a company</Link>
                <Link href="/business/conductor/login" className="block text-[#5C6578] lg:hidden">Are you a conductor? Sign in here</Link>
              </>
            ) : null}
            {resolved === 'conductor' ? (
              <>
                <p className="font-medium text-[#5C6578]">No account? Ask your bus operator to add you.</p>
                <Link href="/business/login" className="block text-[#1F5BFF] lg:hidden">Are you the operator? Sign in here</Link>
              </>
            ) : null}
          </div>
          {!state?.ok && accounts.length > 0 ? (
            <div className="mt-4 space-y-2">
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
      </div>
    </main>
  );
}

