'use client';

export function PrintBusSign() {
  return <button type="button" className="rounded-xl bg-[#1F5BFF] px-4 py-2 font-bold text-white" onClick={() => window.print()}>Print sign</button>;
}
