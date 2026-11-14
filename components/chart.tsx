'use client';

import type { ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatGrouped } from '@/lib/money';
import type { ChartPoint } from '@/lib/types';

function lusakaHour() {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lusaka', hour: '2-digit', hourCycle: 'h23' }).format(new Date());
  return Number(hour);
}

export function EarningsChart({ points, title, extra, untilHour }: { points: ChartPoint[]; title: string; extra?: ReactNode; untilHour?: number }) {
  const hourly = points.length > 0 && /^\d{2}:00$/.test(points[0].label);
  const end = untilHour ?? lusakaHour();
  const clipped = hourly ? points.filter((point) => Number(point.label.slice(0, 2)) <= Math.max(end, 6)) : points;
  let running = 0;
  const data = clipped.map((point) => {
    running += point.value;
    const shown = hourly ? running : point.value;
    return { ...point, shown, kwacha: shown / 100 };
  });
  const empty = data.every((point) => point.shown === 0);
  return (
    <figure className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-3">
        <figcaption className="text-[16px] font-semibold text-[#0F1A14]">{title}</figcaption>
        {extra}
      </div>
      {empty ? (
        <p className="py-16 text-center text-[14px] text-[#6B7570]">No fares in this period yet.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B5D3B" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#0B5D3B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(15,26,20,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#6B7570', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#6B7570', fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(value: number) => (value >= 1000 ? `K${Math.round(value / 100) / 10}k` : `K${Math.round(value)}`)} />
              <Tooltip
                cursor={{ stroke: 'rgba(11,93,59,0.35)', strokeDasharray: '3 3' }}
                formatter={(value, _name, item) => {
                  const shown = (item?.payload as { shown?: number } | undefined)?.shown;
                  return [formatGrouped(shown ?? Math.round(Number(value) * 100)), 'Earnings'];
                }}
              />
              <Area type="monotone" dataKey="kwacha" stroke="#0B5D3B" strokeWidth={2.5} fill="url(#earnFill)" isAnimationActive={false} activeDot={{ r: 4, fill: '#0B5D3B', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
