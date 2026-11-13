'use client';

import type { ReactNode } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatGrouped } from '@/lib/money';
import type { ChartPoint } from '@/lib/types';

export function EarningsChart({ points, title, extra }: { points: ChartPoint[]; title: string; extra?: ReactNode }) {
  const data = points.map((point) => ({ ...point, kwacha: point.value / 100 }));
  const empty = points.every((point) => point.value === 0);
  return (
    <figure className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(15,26,20,0.05)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <figcaption className="text-base font-semibold tracking-tight text-[#0F1A14]">{title}</figcaption>
        {extra}
      </div>
      {empty ? (
        <p className="py-16 text-center text-sm text-[#6A756E]">No fares in this period yet.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B5D3B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0B5D3B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#7A857E', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#7A857E', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(value: number) => (value >= 1000 ? `K${value / 1000}K` : `K${Math.round(value)}`)} />
              <Tooltip
                cursor={{ stroke: '#0B5D3B', strokeDasharray: '3 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const point = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-xl bg-[#0F1A14] px-3 py-2 text-center text-white shadow-lg">
                      <div className="text-sm font-semibold">{formatGrouped(point.value)}</div>
                      <div className="text-[11px] text-white/70">{point.label}</div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="kwacha" stroke="#0B5D3B" strokeWidth={2.5} fill="url(#earnFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
