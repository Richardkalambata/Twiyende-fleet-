import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { EarningsChart } from '@/components/chart';
import { BellIcon, BusIcon, ChartIcon, ClockIcon, TicketIcon } from '@/components/icons';
import { Avatar } from '@/components/shell';
import { RangeLinks, RouteSelect, StatusPill } from '@/components/owner-frame';
import { StatCard } from '@/components/ui';
import { formatGrouped, formatPercent } from '@/lib/money';
import { getOwnerDashboard, parseRange } from '@/lib/service';
import { lusakaParts, timeGreeting } from '@/lib/time';

export const metadata = { title: 'Fleet' };

export default async function FleetPage({ searchParams }: { searchParams: Promise<{ range?: string; route?: string; reset?: string }> }) {
  const user = await requireUser(['operator']);
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
          <Link href="/business/desk/lost" className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm" aria-label="Alerts">
            <BellIcon className="h-5 w-5" />
            {dash.openLost > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#E8833A]" /> : null}
          </Link>
        </div>
      </header>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={range === 'today' ? 'Total today' : range === 'week' ? 'This week' : 'This month'} value={formatGrouped(dash.totalNgwee)} detail={percentLine(earnings, compare)} icon={<ChartIcon className="h-5 w-5" />} spark={dash.chart.map((point) => point.value)} />
        <StatCard label="Active buses" value={String(dash.activeBuses)} detail={`out of ${dash.totalBuses} total buses`} icon={<BusIcon className="h-5 w-5" />} />
        <StatCard label="Rides" value={String(dash.rides)} detail={percentLine(rides, compare)} icon={<TicketIcon className="h-5 w-5" />} spark={dash.chart.map((point) => point.value)} />
        <StatCard label="Next payout" value={formatGrouped(dash.nextPayoutNgwee)} detail={dash.nextPayoutNgwee > 0 ? 'at 18:00' : 'Paid out today'} icon={<ClockIcon className="h-5 w-5" />} />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <EarningsChart
            points={dash.chart}
            untilHour={range === 'today' ? lusakaParts(new Date()).hour : undefined}
            title={range === 'today' ? 'Earnings today' : range === 'week' ? 'Earnings this week' : 'Earnings this month'}
            extra={<RouteSelect range={range} route={route} routes={dash.routes} />}
          />
          <section className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-[16px] font-semibold">Buses</h2>
              <Link href="/business/desk/buses" className="text-[13px] text-[#6B7570]">View all</Link>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="data">
                <thead>
                  <tr>
                    <th className="px-4">Bus</th>
                    <th>Plate</th>
                    <th>Conductor</th>
                    <th className="num">Rides</th>
                    <th className="num">Earnings</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((bus) => (
                    <tr key={bus.id}>
                      <td className="px-4 font-semibold">Bus {bus.fleetNumber}</td>
                      <td>{bus.plate}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <Avatar initials={bus.conductorInitials ?? '–'} size={28} />
                          {bus.conductorName ?? 'Unassigned'}
                        </span>
                      </td>
                      <td className="num">{bus.rides}</td>
                      <td className="num font-semibold">{formatGrouped(bus.earningsNgwee)}</td>
                      <td className="px-4"><StatusPill status={bus.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <Leaderboard buses={dash.buses} />
      </div>
    </div>
  );
}

function percentLine(stat: { text: string; up: boolean } | null, compare: string) {
  if (!stat) return 'No earlier fares to compare';
  return `${stat.up ? '↑' : '↓'} ${stat.text} ${compare}`;
}

function Leaderboard({ buses }: { buses: { conductorName: string | null; conductorInitials: string | null; rides: number; earningsNgwee: number }[] }) {
  const map = new Map<string, { name: string; initials: string; rides: number; earnings: number }>();
  for (const bus of buses) {
    if (!bus.conductorName) continue;
    const row = map.get(bus.conductorName) ?? { name: bus.conductorName, initials: bus.conductorInitials ?? '–', rides: 0, earnings: 0 };
    row.rides += bus.rides;
    row.earnings += bus.earningsNgwee;
    map.set(bus.conductorName, row);
  }
  const rows = [...map.values()].sort((a, b) => b.earnings - a.earnings).slice(0, 4);
  const max = rows[0]?.earnings || 1;
  return (
    <aside className="overflow-hidden rounded-2xl bg-white p-4 shadow-card">
      <h2 className="text-[16px] font-semibold">Conductors</h2>
      <p className="mt-1 text-[13px] text-[#6B7570]">Ranked by earnings</p>
      {rows.length === 0 ? <p className="mt-6 text-[14px] text-[#6B7570]">No verified fares in this period.</p> : null}
      <ol className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.name}>
            <div className="flex items-center gap-3">
              <Avatar initials={row.initials} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{row.name}</div>
                <div className="text-[12px] text-[#6B7570]">{row.rides} rides</div>
              </div>
              <div className="num text-[14px] font-semibold">{formatGrouped(row.earnings)}</div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F3EFE7]">
              <div className="h-full max-w-full rounded-full bg-[#0B5D3B]" style={{ width: `${Math.min(100, Math.max(8, (row.earnings / max) * 100))}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
