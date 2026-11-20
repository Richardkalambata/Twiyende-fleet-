'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { topUpAction } from '@/lib/actions';
import { Plus } from 'lucide-react';
import { formatBalance, parseMoney } from '@/lib/money';
import { formatPhone, normalizePhone } from '@/lib/phone';

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
  const [review, setReview] = useState<{ amount: number; network: typeof network; phone: string } | null>(null);
  const [reentered, setReentered] = useState('');
  const submitting = useRef(false);
  const amountNgwee = parseMoney(amount, 50_000);

  function continueToReview() {
    setError(null);
    setDone(null);
    const confirmedPhone = normalizePhone(number);
    if (amountNgwee == null || !confirmedPhone) {
      setError(amountNgwee == null ? 'Enter an amount from K1 to K500 with up to two decimal places.' : 'Enter a valid Zambian mobile number.');
      return;
    }
    setReentered('');
    setReview({ amount: amountNgwee, network, phone: confirmedPhone });
  }

  async function submit() {
    if (!review || submitting.current) return;
    if (parseMoney(reentered, 50_000) !== review.amount) {
      setError('That amount does not match. Check it and try again.');
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await topUpAction(review.network, review.phone, (review.amount / 100).toFixed(2));
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(result.balanceNgwee);
      setReview(null);
      setReentered('');
      router.refresh();
    } catch {
      setReview(null);
      setReentered('');
      setError('The top-up result could not be confirmed. Check your wallet before trying again.');
      router.refresh();
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (review) {
    const label = NETWORKS.find((item) => item.id === review.network)?.label;
    return (
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4 px-5 pb-8 text-[#0B1B3B]">
        <h2 className="text-xl font-extrabold">Confirm top-up</h2>
        <div className="rounded-2xl bg-[#E7EEFF] p-4">
          <p className="text-sm text-[#3E4A63]">Amount to add</p>
          <p className="text-3xl font-extrabold">+{formatBalance(review.amount)}</p>
          <p className="mt-1 text-sm">{label} · {formatPhone(review.phone)}</p>
        </div>
        <label className="block text-sm font-semibold">
          Re-enter the amount in K
          <input autoFocus autoComplete="off" inputMode="decimal" value={reentered} disabled={pending} onChange={(event) => { setReentered(event.target.value); setError(null); }} className="mt-2 w-full rounded-xl border border-[#D5DCE8] bg-white px-3 py-2 text-lg" />
        </label>
        {error ? <p className="text-sm text-[#C32C32]" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending || !reentered.trim()} className="h-12 w-full rounded-xl bg-[#1F5BFF] font-bold text-white disabled:opacity-50">
          {pending ? 'Adding funds…' : `Confirm +${formatBalance(review.amount)}`}
        </button>
        <button type="button" disabled={pending} onClick={() => { setReview(null); setError(null); }} className="h-10 w-full font-bold text-[#184bde] disabled:opacity-50">Edit top-up</button>
      </form>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-8 text-[#0B1B3B]">
      <p className="text-[13px] text-[#5C6578]">Demo mode · Simulated payments · Balance {formatBalance(done ?? balanceNgwee)}</p>
      <label className="block text-sm font-semibold">
        Amount to add (K)
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" aria-label="Custom top-up amount" className="mt-2 w-full rounded-xl border border-[#D5DCE8] bg-white px-3 py-2 text-xl font-bold text-[#0B1B3B]" />
      </label>
      <div className="grid grid-cols-4 gap-2">
        {AMOUNTS.map((value) => (
          <button key={value} type="button" onClick={() => setAmount(value)} aria-pressed={amount === value} className={`h-10 rounded-lg font-bold ${amount === value ? 'bg-[#1F5BFF] text-white' : 'border border-[#E4E8F0] bg-white text-[#0B1B3B]'}`}>K{value}</button>
        ))}
      </div>
      <p className="text-[13px] font-semibold">Pay with mobile money</p>
      <div className="space-y-2">
        {NETWORKS.map((item) => (
          <button key={item.id} type="button" onClick={() => setNetwork(item.id)} aria-pressed={network === item.id} className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left">
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
      <button type="button" onClick={continueToReview} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5BFF] font-bold text-white">
        <Plus className="h-5 w-5" aria-hidden />
        {amountNgwee == null ? 'Review top-up' : `Review ${formatBalance(amountNgwee)}`}
      </button>
    </div>
  );
}
