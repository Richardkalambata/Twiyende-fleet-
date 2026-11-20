import { requireUser } from '@/lib/auth';
import { EmptyState } from '@/components/ui';
import { formatBalance, formatGrouped } from '@/lib/money';
import { listConductorTrips } from '@/lib/service';
import { ConductorRefresh } from '@/components/conductor-refresh';
import { Check } from 'lucide-react';

export const metadata = { title: 'Trips' };

export default async function TripsPage() {
  const user = await requireUser(['conductor']);
  const data = await listConductorTrips(user.id);
  return (
    <div className="safe-top space-y-4 px-5 pb-6">
      <ConductorRefresh />
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">Today&apos;s trips</h1>
        <p className="text-[14px] text-[#5C6578]">Bus {data.bus?.fleet_number ?? '—'} · {data.bus?.route ?? 'No route yet'} · Zambia time</p>
      </header>
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">Today’s assignments</h2>
        {data.assignments.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {data.assignments.map((assignment) => <li key={assignment.fleet_number}><strong>Bus {assignment.fleet_number}</strong> · {assignment.route || 'Route to be confirmed'}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-[#5C6578]">No assignment scheduled for today.</p>}
      </section>
      <section className="rounded-2xl bg-[#0B1B3B] p-4 text-white">
        <p className="text-[12px] text-white/70">Complete fares</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="num text-[32px] font-extrabold leading-none">{formatGrouped(data.todayNgwee)}</p>
          <p className="text-[14px] text-white/80">{data.todayRides} rides</p>
        </div>
      </section>
      {data.trips.length === 0 ? <EmptyState title="No fares yet" body="Complete fares today will appear here." /> : null}
      <ul className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
        {data.trips.map((trip) => (
          <li key={`${trip.code}-${trip.timeLabel}`} className="flex items-center gap-3 border-b border-[#F0F2F7] px-4 py-3 last:border-0">
            <span className="num w-12 text-[13px] font-semibold text-[#5C6578]">{trip.timeLabel}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{trip.passenger}</span>
              <span className="text-[12px] tracking-[0.08em] text-[#8A93A6]">{trip.code}</span>
            </span>
            <span className="num text-[15px] font-bold">{formatBalance(trip.amountNgwee)}</span>
            <Check className="h-4 w-4 text-[#12B76A]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
