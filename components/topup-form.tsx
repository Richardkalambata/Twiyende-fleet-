'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { topUpAction } from '@/lib/actions';
import { formatBalance } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { buttonClass } from './shell';

const NETWORKS = [
  { id: 'mtn', label: 'MTN MoMo', hint: '097 / 096' },
  { id: 'airtel', label: 'Airtel Money', hint: '097 / 077' },
  { id: 'zamtel', label: 'Zamtel Kwacha', hint: '095' },
] as const;

const AMOUNTS = ['20', '50', '100', '200'];

export function TopUpForm({ phone, balanceNgwee }: { phone: string; balanceNgwee: number }) {
  const router = useRouter();
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]['id']>('mtn');
  const [amount, setAmount] = useState('50');
  const [number, setNumber] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await topUpAction(network, number, amount);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(result.balanceNgwee);
    router.refresh();
  }

  return (
    <div className="space-y-4 px-4 pb-8">
      <p className="text-sm text-[#5C6B63]">Balance now {formatBalance(balanceNgwee)}. Top-up is simulated — a payment aggregator for MTN, Airtel and Zamtel plugs in at this step.</p>
      <div className="grid gap-2">
        {NETWORKS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setNetwork(item.id)}
            className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left ${network === item.id ? 'border-[#0B5D3B] bg-[#E7F3EC]' : 'border-[#E8E2D8] bg-white'}`}
          >
            <span className="font-semibold">{item.label}</span>
            <span className="text-sm text-[#5C6B63]">{item.hint}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {AMOUNTS.map((value) => (
          <button key={value} type="button" className={`h-14 rounded-2xl font-semibold ${amount === value ? 'bg-[#0B5D3B] text-white' : 'bg-white'}`} onClick={() => setAmount(value)}>
            K{value}
          </button>
        ))}
      </div>
      <label className="block text-sm font-medium">
        Other amount (K)
        <input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} className="field mt-1.5" />
      </label>
      <label className="block text-sm font-medium">
        Mobile money number
        <input value={number} inputMode="tel" onChange={(event) => setNumber(event.target.value)} className="field mt-1.5" />
      </label>
      {error ? <p className="text-sm text-[#9A3B1A]" role="alert">{error}</p> : null}
      {done != null ? <p className="rounded-2xl bg-[#E7F3EC] px-4 py-3 text-sm text-[#0B5D3B]" role="status">Simulated top-up complete. New balance {formatBalance(done)} on {formatPhone(number)}.</p> : null}
      <button type="button" className={buttonClass('copper')} disabled={pending} onClick={submit}>{pending ? 'Contacting provider…' : `Top up K${amount || ''}`}</button>
    </div>
  );
}
