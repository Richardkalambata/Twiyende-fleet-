'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cancelFareAction } from '@/lib/actions';
import { formatBalance } from '@/lib/money';

export function ShareReceipt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Twende receipt', text });
        return;
      } catch {
        /* The passenger dismissed the sheet. Fall through to copy. */
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }
  return (
    <button type="button" className="h-12 w-full text-center text-[15px] font-semibold text-[#5C6B63]" onClick={share}>
      {copied ? 'Receipt copied' : 'Share receipt'}
    </button>
  );
}

export function CancelFare({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  async function cancel() {
    setPending(true);
    const result = await cancelFareAction(rideId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBalance(result.balanceNgwee);
    router.refresh();
  }

  if (balance != null) return <p className="text-center text-sm text-[#0B5D3B]">Fare cancelled. Balance {formatBalance(balance)}.</p>;
  return (
    <div>
      <button type="button" className="h-12 w-full text-sm font-semibold text-[#9A3B1A]" disabled={pending} onClick={cancel}>
        {pending ? 'Cancelling…' : 'Wrong bus? Cancel this fare'}
      </button>
      {error ? <p className="text-center text-sm text-[#9A3B1A]">{error}</p> : null}
    </div>
  );
}
