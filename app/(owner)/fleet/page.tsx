import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { EarningsChart } from '@/components/chart';
import { BellIcon, BusIcon, ChartIcon, ClockIcon, TicketIcon } from '@/components/icons';
import { Avatar } from '@/components/shell';
import { RangeLinks, RouteSelect, StatusPill } from '@/components/owner-frame';
import { formatGrouped, formatPercent } from '@/lib/money';
import { getOwnerDashboard, parseRange } from '@/lib/service';
import { timeGreeting } from '@/lib/time';

export const metadata = { title: 'Fleet' };

export default async function FleetPage({ searchParams }: { searchParams: Promise<{ range?: string; route?: string; reset?: string }> }) {
  const user = await requireUser(['owner']);
  const params = await searchParams;
  const range = parseRange(params.range);
  const route = params.route || 'all';
  const dash = await getOwnerDashboard(user.id, range, route);
  const earnings = formatPercent(dash.totalNgwee, dash.previousNgwee);
  const rides = formatPercent(dash.rides, dash.previousRides);
  const compare = range === 'today' ? 'vs yesterday' : range === 'week' ? 'vs prior 7 days' : 'vs last month';
  const active = dash.buses.filter((bus) => bus.status === 'active');
  return (
    <div className="px-4 py-5 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">{timeGreeting()}, {user.shortName}</h1>
          <p className="text-sm text-[#5C6B63]">Here’s what’s happening with your fleet {range === 'today' ? 'today' : range === 'week' ? 'this week' : 'this month'}.</p>
          <span className="mt-2 inline-flex rounded-full bg-[#FFF1E6] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#C2611E]">Demo data</span>
          {params.reset ? <span className="ml-2 text-sm text-[#0B5D3B]">Demo fleet restored.</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <RangeLinks range={range} route={route} />
          <a href={`/api/export?range=${range}`} className="inline-flex h-11 items-center rounded-full bg-[#E8833A] px-4 text-sm font-semibold text-white">Export</a>
          <Link href="/fleet/lost" className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm" aria-label="Alerts">
            <BellIcon className="h-5 w-5" />
            {dash.openLost > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#E8833A]" /> : null}
          </Link>
        </div>
      </header>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={range === 'today' ? 'Total today' : range === 'week' ? 'This week' : 'This month'} value={formatGrouped(dash.totalNgwee)} detail={percentLine(earnings, compare)} icon={<ChartIcon className="h-5 w-5" />} />
        <Kpi label="Active buses" value={String(dash.activeBuses)} detail={`out of ${dash.totalBuses} total buses`} icon={<BusIcon className="h-5 w-5" />} />
        <Kpi label="Rides" value={String(dash.rides)} detail={percentLine(rides, compare)} icon={<TicketIcon className="h-5 w-5" />} />
        <Kpi label="Next payout" value={formatGrouped(dash.nextPayoutNgwee)} detail={dash.nextPayoutNgwee > 0 ? 'at 18:00' : 'Paid out today'} icon={<ClockIcon className="h-5 w-5" />} />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <EarningsChart
            points={dash.chart}
            title={range === 'today' ? 'Earnings today' : range === 'week' ? 'Earnings this week' : 'Earnings this month'}
            extra={<RouteSelect range={range} route={route} routes={dash.routes} />}
          />
          <section className="rounded-[28px] bg-white p-4 shadow-[0_8px_30px_rgba(20,36,28,0.04)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Buses</h2>
              <Link href="/fleet/buses" className="text-sm text-[#6A756E]">View all</Link>
            </div>
            <div>
              <table className="w-full text-left text-sm">
                <thead className="text-[#6A756E]">
                  <tr>
                    <th className="py-2 font-medium">Bus</th>
                    <th className="font-medium">Plate</th>
                    <th className="font-medium">Conductor</th>
                    <th className="font-medium">Rides</th>
                    <th className="font-medium">Earnings {range === 'today' ? 'today' : ''}</th>
                    <th className="font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((bus) => (
                    <tr key={bus.id} className="border-t border-[#F0EBE3]">
                      <td className="py-3 font-semibold">Bus {bus.fleetNumber}</td>
                      <td>{bus.plate}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <Avatar initials={bus.conductorInitials ?? '–'} size={28} />
                          {bus.conductorName ?? 'Unassigned'}
                        </span>
                      </td>
                      <td>{bus.rides}</td>
                      <td className="font-semibold">{formatGrouped(bus.earningsNgwee)}</td>
                      <td><StatusPill status={bus.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="rounded-[28px] bg-white p-5 text-center shadow-[0_8px_30px_rgba(20,36,28,0.04)]">
          <div className="flex items-center justify-between text-left">
            <h2 className="font-semibold">Top conductor</h2>
            <span className="text-[#E8833A]"><ChartIcon className="h-5 w-5" /></span>
          </div>
          {dash.topConductor ? (
            <div className="mt-6">
              <Avatar initials={dash.topConductor.initials} size={112} tone="copper" />
              <p className="mt-4 text-2xl font-semibold">{dash.topConductor.name}</p>
              <p className="mt-1 text-4xl font-semibold text-[#E8833A]">{formatGrouped(dash.topConductor.earningsNgwee)}</p>
              <p className="mt-4 text-sm text-[#E8833A]">Today’s top earner ↗</p>
              <p className="text-xs text-[#8A918C]">{dash.topConductor.rides} rides</p>
            </div>
          ) : <p className="mt-8 text-sm text-[#5C6B63]">No verified fares in this period.</p>}
        </aside>
      </div>
    </div>
  );
}

function percentLine(stat: { text: string; up: boolean } | null, compare: string) {
  if (!stat) return 'No earlier fares to compare';
  return `${stat.up ? '↑' : '↓'} ${stat.text} ${compare}`;
}

function Kpi({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  const tone = detail.startsWith('↑') ? 'text-[#1C7A45]' : detail.startsWith('↓') ? 'text-[#9A3B1A]' : 'text-[#6A756E]';
  return (
    <article className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(20,36,28,0.04)]">
      <div className="flex items-center gap-2 text-sm text-[#5C6B63]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F6F1E8] text-[#E8833A]">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight">{value}</p>
      <p className={`mt-1 text-sm ${tone}`}>{detail}</p>
    </article>
  );
}
