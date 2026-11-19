'use client';

import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('./live-map').then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => <div className="h-[62vh] bg-[#E8EDF5]" />,
});

export function MapScreen({ mode }: { mode: 'rider' | 'operator' }) {
  return <LiveMap mode={mode} />;
}
