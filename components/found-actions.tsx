'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tipAction } from '@/lib/actions';
import { TIP_AMOUNTS_NGWEE } from '@/lib/constants';
import { formatCompact } from '@/lib/money';
import { phoneToTel } from '@/lib/phone';
import { buttonClass } from './shell';

export function FoundActions({
  itemId,
  tipNgwee,
  balanceNgwee,
  place,
  conductorPhone,
}: {
  itemId: string;
  tipNgwee: number;
  balanceNgwee: number;
  place: string;
  conductorPhone: string | null;
}) {
  const router = useRouter();
  const [tip, setTip] = useState(tipNgwee);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} Lusaka`)}`;

  async function send(amount: number) {
    setPending(amount);
    setError(null);
    const result = await tipAction(itemId, amount);
    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setTip(amount);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white p-4">
        <p className="text-sm font-medium">Say thanks (optional)</p>
        <p className="text-xs text-[#6A756E]">Optional — support the conductor. You have {formatCompact(balanceNgwee)}.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TIP_AMOUNTS_NGWEE.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={tip > 0 || pending != null}
              onClick={() => send(amount)}
              className={`h-12 rounded-full border font-semibold ${tip === amount ? 'border-[#0B5D3B] bg-[#0B5D3B] text-white' : 'border-[#E4DDD2] bg-white'}`}
            >
              {pending === amount ? '…' : formatCompact(amount)}
            </button>
          ))}
        </div>
        {tip > 0 ? <p className="mt-2 text-sm text-[#0B5D3B]">Thanks sent · {formatCompact(tip)}</p> : null}
        {error ? <p className="mt-2 text-sm text-[#9A3B1A]" role="alert">{error}</p> : null}
      </div>
      <a className={buttonClass('green')} href={maps} target="_blank" rel="noreferrer">Get directions</a>
      {conductorPhone ? <a className={buttonClass('outline')} href={`tel:${phoneToTel(conductorPhone)}`}>Call conductor</a> : null}
    </div>
  );
}
