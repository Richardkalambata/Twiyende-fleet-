'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { topUpAction } from '@/lib/actions';
import { formatBalance } from '@/lib/money';
import { formatPhone } from '@/lib/phone';

const NETWORKS = [
  { id: 'mtn', label: 'MTN Mobile Money', color: '#FFCC00', mark: 'MTN' },
  { id: 'airtel', label: 'Airtel Money', color: '#ED1C24', mark: 'airtel' },
  { id: 'zamtel', label: 'Zamtel Money', color: '#0B8F3C', mark: 'Zamtel' },
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
    <div className="space-y-4 px-5 pb-8 text-[#0B1B3B]">
      <p className="text-[13px] text-[#5C6578]">Demo mode · Simulated payments · Balance {formatBalance(balanceNgwee)}</p>
      <p className="text-[13px] font-medium text-[#5C6578]">Top-up amount</p>
      <p className="text-[40px] font-extrabold tracking-[-0.04em]">K{Number(amount || 0).toFixed(2)}</p>
      <div className="grid grid-cols-4 gap-2">
        {AMOUNTS.map((value) => (
          <button key={value} type="button" onClick={() => setAmount(value)} className={`h-10 rounded-lg font-bold ${amount === value ? 'bg-[#1F5BFF] text-white' : 'border border-[#E4E8F0] bg-white text-[#0B1B3B]'}`}>K{value}</button>
        ))}
      </div>
      <p className="text-[13px] font-semibold">Pay with mobile money</p>
      <div className="space-y-2">
        {NETWORKS.map((item) => (
          <button key={item.id} type="button" onClick={() => setNetwork(item.id)} className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left">
            <span className="grid h-8 w-12 place-items-center rounded-md text-[10px] font-extrabold text-white" style={{ background: item.color }}>{item.mark}</span>
            <span className="flex-1 font-semibold">{item.label}</span>
            <span className={`h-4 w-4 rounded-full ring-2 ${network === item.id ? 'bg-[#1F5BFF] ring-[#1F5BFF]' : 'ring-[#D5DCE8]'}`} />
          </button>
        ))}
      </div>
      <label className="block text-[13px] text-[#5C6578]">
        Phone number
        <input value={number} onChange={(event) => setNumber(event.target.value)} inputMode="tel" className="mt-1 w-full border-0 border-b border-[#D5DCE8] bg-white py-2 text-[18px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#5C6578]" />
      </label>
      {error ? <p className="text-sm text-[#E5484D]" role="alert">{error}</p> : null}
      {done != null ? <p className="rounded-xl bg-[#E8F8EF] px-3 py-3 text-sm text-[#128A4E]" role="status">Simulated top-up complete. New balance {formatBalance(done)} on {formatPhone(number)}.</p> : null}
      <button type="button" disabled={pending} onClick={submit} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] font-bold text-white disabled:opacity-50">{pending ? 'Contacting provider…' : `Continue with K${Number(amount || 0).toFixed(2)}`}</button>
      <p className="text-center text-[12px] text-[#8A93A6]">Approve the prompt on your phone.</p>
    </div>
  );
}
