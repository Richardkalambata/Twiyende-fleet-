import type { ReactNode } from 'react';
import { formatAxisKwacha, formatGrouped } from '@/lib/money';
import type { ChartPoint } from '@/lib/types';

export function EarningsChart({ points, title, extra }: { points: ChartPoint[]; title: string; extra?: ReactNode }) {
  const width = 640;
  const height = 220;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 24;
  const padBottom = 32;
  const max = Math.max(...points.map((point) => point.value), 1);
  const niceMax = niceCeiling(max);
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const coords = points.map((point, index) => {
    const x = padLeft + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padTop + innerH - (point.value / niceMax) * innerH;
    return { ...point, x, y };
  });
  const line = smooth(coords);
  const baseline = padTop + innerH;
  const area = coords.length ? `${line} L ${coords[coords.length - 1]!.x} ${baseline} L ${coords[0]!.x} ${baseline} Z` : '';
  const peak = coords.reduce((best, point) => (point.value > best.value ? point : best), coords[0] ?? { x: 0, y: 0, value: 0, label: '' });
  const yTicks = [0, 0.5, 1].map((step) => ({ value: niceMax * step, y: padTop + innerH - step * innerH }));
  const xLabels = labelIndexes(points.length);

  return (
    <figure className="rounded-[28px] bg-white p-4 shadow-[0_8px_30px_rgba(20,36,28,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <figcaption className="text-base font-semibold">{title}</figcaption>
        {extra}
      </div>
      {points.every((point) => point.value === 0) ? (
        <p className="py-16 text-center text-sm text-[#5C6B63]">No fares in this period yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-auto w-full" role="img" aria-label={title}>
          <defs>
            <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F8A5B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1F8A5B" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1={padLeft} x2={width - padRight} y1={tick.y} y2={tick.y} stroke="#E7E1D6" />
              <text x={padLeft - 8} y={tick.y + 4} textAnchor="end" fontSize="11" fill="#7A857E">{formatAxisKwacha(tick.value)}</text>
            </g>
          ))}
          <path d={area} fill="url(#earn)" />
          <path d={line} fill="none" stroke="#1F7A52" strokeWidth="3" strokeLinejoin="round" />
          {peak.value > 0 ? (
            <g>
              <line x1={peak.x} x2={peak.x} y1={peak.y} y2={baseline} stroke="#1F7A52" strokeDasharray="3 4" />
              <circle cx={peak.x} cy={peak.y} r="5" fill="#143028" />
              <g transform={`translate(${Math.min(Math.max(peak.x - 36, padLeft), width - 100)}, ${Math.max(peak.y - 46, 8)})`}>
                <rect width="88" height="36" rx="10" fill="#143028" />
                <text x="44" y="16" textAnchor="middle" fontSize="12" fill="white" fontWeight="600">{formatGrouped(peak.value)}</text>
                <text x="44" y="29" textAnchor="middle" fontSize="10" fill="#D5DDD8">{peak.label}</text>
              </g>
            </g>
          ) : null}
          {xLabels.map((index) => {
            const point = coords[index];
            if (!point) return null;
            return <text key={point.label + index} x={point.x} y={height - 8} textAnchor="middle" fontSize="11" fill="#7A857E">{point.label}</text>;
          })}
        </svg>
      )}
    </figure>
  );
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = pow / 2;
  return Math.ceil(value / step) * step;
}

function labelIndexes(length: number): number[] {
  if (length <= 6) return Array.from({ length }, (_, index) => index);
  const wanted = 6;
  return Array.from({ length: wanted }, (_, index) => Math.round((index * (length - 1)) / (wanted - 1)));
}

function smooth(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  let path = `M ${first.x} ${first.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const after = points[index + 2] ?? next;
    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (after.x - current.x) / 6;
    const cp2y = next.y - (after.y - current.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return path;
}
