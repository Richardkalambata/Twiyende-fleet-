'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./live-map').then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => <div role="status" className="grid h-[62vh] place-items-center bg-[#E8EDF5] text-[#345079]">Opening map…</div>,
});

export type PaidRide = { id: string; busId: string; endsAt: number };

export function MapScreen({ mode, paidRide }: { mode: 'rider' | 'operator'; paidRide?: PaidRide | null }) {
  return <LiveMap key={paidRide?.id ?? mode} mode={mode} paidRide={paidRide} />;
}
