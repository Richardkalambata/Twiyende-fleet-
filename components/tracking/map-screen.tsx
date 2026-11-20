'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./live-map').then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => <div className="h-[62vh] bg-[#E8EDF5]" />,
});

export type PaidRide = { id: string; busId: string; endsAt: number };

export function MapScreen({ mode, paidRide }: { mode: 'rider' | 'operator'; paidRide?: PaidRide | null }) {
  return <LiveMap key={paidRide?.id ?? mode} mode={mode} paidRide={paidRide} />;
}
