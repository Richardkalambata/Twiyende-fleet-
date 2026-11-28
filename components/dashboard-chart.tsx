'use client';

import dynamic from 'next/dynamic';

export const DashboardChart = dynamic(() => import('./chart').then((module) => module.EarningsChart), {
  ssr: false,
  loading: () => <div role="status" className="h-64 rounded-2xl bg-white p-4 text-sm text-[#5C6578]">Loading fare chart…</div>,
});
