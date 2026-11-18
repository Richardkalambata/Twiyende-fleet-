'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount, Fail } from '@/lib/types';
import { Logo } from './shell';
import { toast } from './toast';

export function LoginForm({ accounts, error, gate = 'passenger' }: { accounts: DemoAccount[]; error?: string; gate?: 'passenger' | 'operator' | 'conductor' | 'business' }) {
  const resolved = gate === 'business' ? 'operator' : gate;
  const [state, action, pending] = useActionState(loginAction, null as Fail | null);
  const [phone, setPhone] = useState(resolved === 'operator' ? '0977000001' : resolved === 'conductor' ? '0962000012' : '0971000001');
  const [pin, setPin] = useState('');
  const message = state?.message ?? error;
  useEffect(() => { if (message) toast(message); }, [message]);

  function push(digit: string) {
    setPin((current) => (current + digit).slice(0, 4));
  }

  const title = resolved === 'operator' ? 'Operator sign in' : resolved === 'conductor' ? 'Conductor sign in' : 'Welcome back.';
  const subtitle = resolved === 'operator'
    ? 'Sign in to your company, or create one.'
    : resolved === 'conductor'
      ? 'Use the phone number and PIN your operator gave you.'
      : 'Your next ride starts here.';

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F6FB] px-5 pb-6 text-[#0B1B3B]">
      <div className="safe-top"><Logo business={resolved !== 'passenger'} /></div>
      <h1 className="mt-6 text-[clamp(26px,7vw,32px)] font-extrabold tracking-[-0.04em]">{title}</h1>
      <p className="mt-1 text-[15px] leading-5 text-[#5C6578]">{subtitle}</p>
      <form action={action} className="mt-6">
        <label className="block text-[13px] font-medium text-[#5C6578]">
          Phone number
          <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-transparent py-2 text-[18px] font-semibold outline-none focus:border-[#1F5BFF]" />
        </label>
        <p className="mt-5 text-[13px] font-medium text-[#5C6578]">PIN</p>
        <input type="hidden" name="pin" value={pin} />
        <input type="hidden" name="gate" value={resolved} />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="grid h-12 place-items-center rounded-xl bg-white text-2xl font-bold shadow-sm">{pin[index] ? '•' : ''}</span>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm text-[#E5484D]" role="alert">{message}</p> : null}
        <button className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50" disabled={pending || pin.length < 4}>
          {pending ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button key={digit} type="button" className="h-11 rounded-xl bg-white text-lg font-bold" onClick={() => push(digit)}>{digit}</button>
        ))}
        <span />
        <button type="button" className="h-11 rounded-xl bg-white text-lg font-bold" onClick={() => push('0')}>0</button>
        <button type="button" className="h-11 rounded-xl bg-white text-sm font-semibold" onClick={() => setPin((value) => value.slice(0, -1))}>Delete</button>
      </div>
      <div className="mt-4 space-y-2 text-center text-[13px] font-semibold">
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
      </div>
      {accounts.length > 0 ? (
        <div className="mt-4 space-y-2">
          {accounts.slice(0, 3).map((account) => (
            <form key={account.id} action={demoLoginAction}>
              <input type="hidden" name="userId" value={account.id} />
              <input type="hidden" name="gate" value={resolved} />
              <button type="submit" className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm">
                <span className="font-semibold">{account.shortName}</span>
                <span className="text-[#5C6578]">{formatPhone(account.phone)}</span>
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}

