'use client';

import { useActionState, useEffect, useState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount, Fail } from '@/lib/types';
import { Logo } from './shell';
import { toast } from './toast';

export function LoginForm({ accounts, error, gate = 'passenger' }: { accounts: DemoAccount[]; error?: string; gate?: 'passenger' | 'business' }) {
  const [state, action, pending] = useActionState(loginAction, null as Fail | null);
  const [phone, setPhone] = useState(gate === 'business' ? '0977000001' : '0971000001');
  const [pin, setPin] = useState('');
  const message = state?.message ?? error;
  useEffect(() => { if (message) toast(message); }, [message]);

  function push(digit: string) {
    setPin((current) => (current + digit).slice(0, 4));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F6FB] px-5 pb-6 text-[#0B1B3B]">
      <div className="safe-top"><Logo business={gate === 'business'} /></div>
      <h1 className="mt-8 text-[32px] font-extrabold tracking-[-0.04em]">{gate === 'business' ? 'Welcome to work.' : 'Welcome back.'}</h1>
      <p className="mt-1 text-[15px] text-[#5C6578]">{gate === 'business' ? 'For operators and conductors.' : 'Your next ride starts here.'}</p>
      <form action={action} className="mt-8">
        <label className="block text-[13px] font-medium text-[#5C6578]">
          Phone number
          <input name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-transparent py-2 text-[18px] font-semibold outline-none focus:border-[#1F5BFF]" />
        </label>
        <p className="mt-6 text-[13px] font-medium text-[#5C6578]">PIN</p>
        <input type="hidden" name="pin" value={pin} />
        <input type="hidden" name="gate" value={gate} />
        <div className="mt-2 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="grid h-14 place-items-center rounded-xl bg-white text-2xl font-bold shadow-sm">{pin[index] ? '•' : ''}</span>
          ))}
        </div>
        {message ? <p className="mt-3 text-sm text-[#E5484D]" role="alert">{message}</p> : null}
        <button className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white disabled:opacity-50" disabled={pending || pin.length < 4}>
          {pending ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button key={digit} type="button" className="h-12 rounded-xl bg-white text-lg font-bold" onClick={() => push(digit)}>{digit}</button>
        ))}
        <span />
        <button type="button" className="h-12 rounded-xl bg-white text-lg font-bold" onClick={() => push('0')}>0</button>
        <button type="button" className="h-12 rounded-xl bg-white text-sm font-semibold" onClick={() => setPin((value) => value.slice(0, -1))}>Delete</button>
      </div>
      <div className="mt-4 space-y-2">
        {accounts.slice(0, 4).map((account) => (
          <form key={account.id} action={demoLoginAction}>
            <input type="hidden" name="userId" value={account.id} />
            <input type="hidden" name="gate" value={gate} />
            <button type="submit" className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm">
              <span className="font-semibold">{account.shortName}</span>
              <span className="text-[#5C6578]">{formatPhone(account.phone)}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
