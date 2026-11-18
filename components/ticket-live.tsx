'use client';

import { useEffect, useState } from 'react';

export function TicketWatch({ id, initial }: { id: string; initial: string }) {
  const [status, setStatus] = useState(initial);
  useEffect(() => {
    if (status !== 'pending') return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/rides/${id}`);
      if (!response.ok) return;
      const body = await response.json() as { status?: string };
      if (body.status) setStatus(body.status);
    }, 4000);
    return () => clearInterval(timer);
  }, [id, status]);
  if (status === 'verified') return <p className="mt-3 text-[14px] font-bold text-[#128A4E]">Verified by conductor</p>;
  if (status === 'void') return <p className="mt-3 text-[14px] font-bold text-[#8A93A6]">Cancelled</p>;
  return (
    <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold text-[#C47B12]">
      <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#E8833A]" />
      Awaiting verification
    </p>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] font-bold text-white">
      Download receipt
    </button>
  );
}
