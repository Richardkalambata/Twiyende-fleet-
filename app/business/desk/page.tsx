import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bus, Coins, Users } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { EarningsChart } from '@/components/chart';
import { BellIcon } from '@/components/icons';
import { RangeLinks } from '@/components/owner-frame';
import { formatBalance } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { companyName, getOwnerDashboard, parseRange, ridesForExport } from '@/lib/service';
import { lusakaParts } from '@/lib/time';

export const metadata = { title: 'Fleet' };

export default async function FleetPage({ searchParams }: { searchParams: Promise<{ range?: string; route?: string; reset?: string }> }) {
  const user = await requireUser(['operator']);
  const params = await searchParams;
  const range = parseRange(params.range);
  const route = params.route || 'all';
  const [dash, company] = await Promise.all([getOwnerDashboard(user.id, range, route), companyName(user.id)]);
  const recent = (await ridesForExport(user.id, range === 'month' ? 'month' : range === 'week' ? 'week' : 'today')).slice(0, 6);
  const dateLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lusaka', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const maxEarn = dash.topConductors[0]?.earningsNgwee || 1;
  return (
    <div className="bg-[#F4F6FB] px-4 py-5 text-[#0B1B3B] md:px-6">
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Bus className="h-4 w-4" /> {company}</span>
        <span className="flex items-center gap-2">
          <Link href="/business/desk/notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-[#F4F6FB]" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
            {dash.openLost > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#1F5BFF]" /> : null}
          </Link>
          <span className="hidden text-sm font-semibold sm:block">{user.name}</span>
        </span>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.04em]">Your fleet, at a glance.</h1>
          <p className="text-[14px] text-[#5C6578]">{dateLabel}</p>
          {params.reset ? <p className="text-sm text-[#1F5BFF]">Demo fleet restored.</p> : null}
        </div>
        <RangeLinks range={range} route={route} />
      </header>
      <section className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl bg-white xl:grid-cols-4">
        <Kpi icon={<Coins className="h-4 w-4" />} label={range === 'today' ? "Today’s earnings" : "Period earnings"} value={formatBalance(dash.totalNgwee)} detail={trend(dash.totalNgwee, dash.previousNgwee)} />
        <Kpi icon={<Bus className="h-4 w-4" />} label={range === 'today' ? "Rides today" : "Period rides"} value={String(dash.rides)} detail={trend(dash.rides, dash.previousRides)} />
        <Kpi icon={<Bus className="h-4 w-4" />} label="Active buses" value={String(dash.activeBuses)} detail={`${dash.totalBuses} in the fleet`} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Conductors on shift" value={String(dash.onShift)} detail="Active shifts" last />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <EarningsChart
          points={dash.chart}
          untilHour={range === 'today' ? lusakaParts(new Date()).hour : undefined}
          title="Fare collections"
          extra={<RangeLinks range={range} route={route} />}
        />
        <aside className="rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Top 5 conductors</h2>
            <span className="text-[13px] text-[#5C6578]">Total: {formatBalance(dash.totalNgwee)}</span>
          </div>
          <ul className="mt-4 space-y-3">
            {dash.topConductors.length === 0 ? <li className="text-sm text-[#5C6578]">No complete fares in this period.</li> : null}
            {dash.topConductors.map((person) => (
              <li key={person.id}>
                <div className="flex items-center justify-between text-[14px] font-semibold">
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-[#1F5BFF]" /> {person.name}</span>
                  <span>{formatBalance(person.earningsNgwee)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8EEF9]">
                  <div className="h-full rounded-full bg-[#1F5BFF]" style={{ width: `${Math.max(6, (person.earningsNgwee / maxEarn) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-extrabold">Recent fares</h2>
          <Link href={`/business/desk/fares?range=${range}`} className="text-[13px] font-semibold text-[#1F5BFF]">View all →</Link>
        </div>
        <ul className="mt-2 divide-y divide-[#E6EAF2] md:hidden">
          {recent.length === 0 ? <li className="px-4 py-8 text-center text-[14px] text-[#5C6578]">No fares in this period yet.</li> : null}
          {recent.map((ride) => (
            <li key={`${ride.code}-${ride.createdAt}`} className="flex items-center gap-3 px-4 py-3">
              <span className="num w-12 text-[13px] text-[#5C6578]">{formatHour24(ride.createdAt)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{ride.passenger}</span>
                <span className="block truncate text-[12px] text-[#5C6578]">Bus {ride.fleetNumber} · {ride.conductor || 'Unassigned'}</span>
              </span>
              <span className="text-right">
                <span className="num block text-[15px] font-bold">{formatBalance(ride.amountNgwee)}</span>
                <span className={`text-[11px] font-bold ${ride.status === 'verified' ? 'text-[#128A4E]' : 'text-[#C47B12]'}`}>{ride.status === 'verified' ? 'Complete' : ride.status === 'pending' ? 'Pending' : 'Cancelled'}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 hidden overflow-x-auto md:block">
          <table className="data">
            <thead>
              <tr>
                <th className="px-4">Time</th>
                <th>Passenger</th>
                <th>Bus</th>
                <th>Conductor</th>
                <th className="num">Fare</th>
                <th className="px-4">Verification</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((ride) => (
                <tr key={`${ride.code}-${ride.createdAt}`}>
                  <td className="px-4">{formatHour24(ride.createdAt)}</td>
                  <td>{ride.passenger}</td>
                  <td>Bus {ride.fleetNumber}</td>
                  <td>{ride.conductor || '—'}</td>
                  <td className="num font-semibold">{formatBalance(ride.amountNgwee)}</td>
                  <td className="px-4">{ride.status === 'verified' ? <span className="font-semibold text-[#128A4E]">Complete</span> : ride.status === 'pending' ? <span className="font-semibold text-[#C47B12]">Pending</span> : <span>Cancelled</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sr-only">{route}</p>
      </section>
    </div>
  );
}

function trend(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? '↑ new this period' : 'No change yet';
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `↑ ${pct}% vs last period` : `↓ ${Math.abs(pct)}% vs last period`;
}

function Kpi({ icon, label, value, detail, last }: { icon: ReactNode; label: string; value: string; detail: string; last?: boolean }) {
  const up = detail.startsWith('↑');
  const down = detail.startsWith('↓');
  return (
    <div className={`px-4 py-4 ${last ? '' : 'border-b border-[#E6EAF2] xl:border-b-0 xl:border-r'}`}>
      <span className="flex items-center gap-2 text-[12px] text-[#5C6578]"><span className="grid h-8 w-8 place-items-center rounded-lg ring-1 ring-[#D5DCE8]">{icon}</span>{label}</span>
      <span className="num mt-2 block text-[22px] font-extrabold tracking-[-0.03em]">{value}</span>
      <span className={`mt-1 block text-[12px] font-semibold ${up ? 'text-[#128A4E]' : down ? 'text-[#C53434]' : 'text-[#5C6578]'}`}>{detail}</span>
    </div>
  );
}
