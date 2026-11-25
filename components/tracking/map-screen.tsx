'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const LiveMap = dynamic(() => import('./live-map').then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => <div className="h-[62vh] bg-[#E8EDF5]" />,
});

export type PaidRide = { id: string; busId: string; endsAt: number };

export function MapScreen({ mode, paidRide }: { mode: 'rider' | 'operator'; paidRide?: PaidRide | null }) {
  const [enabled, setEnabled] = useState(false);
  if (enabled) return <LiveMap key={paidRide?.id ?? mode} mode={mode} paidRide={paidRide} />;
  return (
    <section className="mx-auto max-w-xl space-y-3 px-5 py-6 lg:mx-0 lg:px-10">
      <h1 className="text-2xl font-extrabold">{mode === 'rider' ? 'Live buses' : 'Fleet map'}</h1>
      <p className="text-sm text-[#5C6578]">Load the live map when you need it to save mobile data.</p>
      <button type="button" className="min-h-11 rounded-xl bg-[#184BDE] px-4 font-bold text-white" onClick={() => setEnabled(true)}>
        {paidRide ? 'Track your bus' : 'Load live map'}
      </button>
    </section>
  );
}
