import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { parseRange, ridesForExport } from '@/lib/service';

export const metadata = { title: 'Fleet fares' };

export default async function FaresPage({ searchParams }: { searchParams: Promise<{ range?: string; status?: string; page?: string }> }) {
  const user = await requireUser(['operator']);
  const params = await searchParams;
  const range = parseRange(params.range);
  const status = ['verified', 'pending', 'void'].includes(params.status ?? '') ? params.status : undefined;
  const rides = (await ridesForExport(user.id, range)).filter((ride) => !status || ride.status === status);
  const size = 25;
  const pages = Math.max(1, Math.ceil(rides.length / size));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1));
  const href = (next: number) => `?range=${range}&status=${status ?? ''}&page=${next}`;
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-bold">Fares</h1>
      <form action="/business/desk/fares" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-3">
        <label className="text-sm font-semibold">Period<select name="range" defaultValue={range} className="ml-2 h-10"><option value="today">Today</option><option value="week">Week</option><option value="month">Month</option></select></label>
        <label className="text-sm font-semibold">Status<select name="status" defaultValue={status ?? ''} className="ml-2 h-10"><option value="">All fares</option><option value="verified">Verified</option><option value="pending">Awaiting</option><option value="void">Cancelled</option></select></label>
        <button className="min-h-10 rounded-xl bg-[#184BDE] px-4 font-bold text-white">Apply</button>
      </form>
      <ul className="divide-y divide-[#E6EAF2] rounded-2xl bg-white px-4">
        {rides.slice((page - 1) * size, page * size).map((ride) => <li key={`${ride.code}-${ride.createdAt}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <div><strong>{ride.passenger}</strong><p>Bus {ride.fleetNumber} · {ride.conductor || 'Unassigned'} · {new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeZone: 'Africa/Lusaka' }).format(ride.createdAt)} {formatHour24(ride.createdAt)}</p></div>
          <div className="text-right"><strong>{formatBalance(ride.amountNgwee)}</strong><p>{ride.status === 'verified' ? 'Verified' : ride.status === 'pending' ? 'Awaiting' : 'Cancelled'}</p></div>
        </li>)}
        {!rides.length ? <li className="py-4 text-sm">No fares match these filters.</li> : null}
      </ul>
      <nav aria-label="Fare pages" className="flex justify-between gap-3 text-sm">
        {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span />}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link href={href(page + 1)}>Next →</Link> : <span />}
      </nav>
    </div>
  );
}
