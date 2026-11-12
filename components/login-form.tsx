'use client';

import { useActionState } from 'react';
import { demoLoginAction, loginAction } from '@/lib/actions';
import { formatPhone } from '@/lib/phone';
import type { DemoAccount, Fail } from '@/lib/types';
import { buttonClass, Wordmark } from './shell';

export function LoginForm({ accounts, error }: { accounts: DemoAccount[]; error?: string }) {
  const [state, action, pending] = useActionState(loginAction, null as Fail | null);
  const pinned = [
    accounts.find((account) => account.role === 'passenger' && account.shortName === 'Richard'),
    accounts.find((account) => account.shortName === 'Mwila'),
    accounts.find((account) => account.role === 'owner'),
  ].filter(Boolean) as DemoAccount[];
  const rest = accounts.filter((account) => !pinned.includes(account));

  return (
    <div>
      <Wordmark subtitle="Cashless fares · Lusaka" />
      <h1 className="mt-6 text-[32px] font-semibold tracking-tight">Pay the fare from your phone</h1>
      <p className="mt-2 text-[#5C6B63]">Passengers, conductors and owners share one record of every ride.</p>
      <form action={action} className="mt-6 space-y-3">
        <label className="block text-sm font-medium">
          Phone number
          <input name="phone" inputMode="tel" autoComplete="tel" placeholder="0971 000 001" className="mt-1 h-14 w-full rounded-2xl border border-[#E4DDD2] bg-white px-4 text-base outline-none" />
        </label>
        <label className="block text-sm font-medium">
          PIN
          <input name="pin" inputMode="numeric" autoComplete="current-password" maxLength={4} placeholder="4 digits" className="mt-1 h-14 w-full rounded-2xl border border-[#E4DDD2] bg-white px-4 text-base outline-none" />
        </label>
        {state?.message || error ? <p className="text-sm text-[#9A3B1A]" role="alert">{state?.message ?? error}</p> : null}
        <button className={buttonClass('green')} disabled={pending}>{pending ? 'Signing in…' : 'Continue'}</button>
      </form>
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8A918C]">Demo data</h2>
        <p className="mt-1 text-sm text-[#5C6B63]">Tap a sample account. PIN for every demo person is 1234.</p>
        <div className="mt-3 space-y-2">
          {pinned.map((account) => (
            <form key={account.id} action={demoLoginAction}>
              <input type="hidden" name="userId" value={account.id} />
              <button type="submit" className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm">
                <span>
                  <span className="block font-semibold">{account.role === 'owner' ? account.name : account.shortName}</span>
                  <span className="block text-sm capitalize text-[#5C6B63]">{account.role} · {account.detail}</span>
                </span>
                <span className="text-sm text-[#0B5D3B]">{formatPhone(account.phone)}</span>
              </button>
            </form>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {rest.map((account) => (
            <form key={account.id} action={demoLoginAction}>
              <input type="hidden" name="userId" value={account.id} />
              <button type="submit" className="h-10 rounded-full bg-white px-3 text-sm shadow-sm">{account.shortName}</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
