'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export function TicketWatch({ id, initial, code }: { id: string; initial: string; code: string }) {
  const [status, setStatus] = useState(initial);
  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/rides/${id}`);
      if (!response.ok) return;
      const body = await response.json() as { status?: string };
      if (body.status && body.status !== 'pending') setStatus(body.status);
    }, 4000);
    return () => clearInterval(timer);
  }, [id, status]);
  const verified = status === 'verified';
  return (
    <div className="text-center">
      <div className={verified ? 'code-ok' : status === 'pending' ? 'code-wait' : ''}>
        <p className="fare-code num px-2 py-1 text-[52px] font-extrabold leading-none">{code}</p>
      </div>
      <p className="mt-2 text-[13px] font-semibold text-[#3E4A63]">Show this code to your conductor</p>
      {verified ? (
        <p className="check-pop mt-3 inline-flex items-center gap-1 text-[14px] font-bold text-[#0E7A45]">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Verified by conductor
        </p>
      ) : status === 'void' ? (
        <p className="mt-3 text-[14px] font-bold text-[#3E4A63]">Cancelled</p>
      ) : (
        <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold text-[#9A5B00]">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#E8833A]" />
          Awaiting verification
        </p>
      )}
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="press mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] font-bold text-white">
      Download receipt
    </button>
  );
}
