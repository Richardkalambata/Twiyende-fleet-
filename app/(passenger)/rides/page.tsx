import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { BusIcon } from '@/components/icons';
import { EmptyState, ListRow } from '@/components/ui';
import { formatCompact } from '@/lib/money';
import { listPassengerRides } from '@/lib/service';

export const metadata = { title: 'Rides' };

export default async function RidesPage({ searchParams }: { searchParams: Promise<{ status?: string; month?: string }> }) {
  const user = await requireUser(['passenger']);
  const params = await searchParams;
  const all = await listPassengerRides(user.id);
  const month = params.month;
  const rides = all.filter((ride) => {
    if (params.status === 'verified' || params.status === 'pending' || params.status === 'void') {
      if (ride.status !== params.status) return false;
    }
    if (month) {
      const stamp = new Date(ride.createdAt);
      const key = `${stamp.getUTCFullYear()}-${String(stamp.getUTCMonth() + 1).padStart(2, '0')}`;
      if (key !== month) return false;
    }
    return true;
  });
  const spent = rides.filter((ride) => ride.status !== 'void').reduce((sum, ride) => sum + ride.amountNgwee, 0);
  const filters = [
    ['', 'All'],
    ['verified', 'Verified'],
    ['pending', 'Pending'],
  ] as const;
  return (
    <div className="safe-top px-5 pb-6">
      <h1 className="text-[32px] font-extrabold tracking-[-0.04em] text-[#0B1B3B]">My rides</h1>
      <p className="text-[14px] text-[#5C6578]">{rides.length} rides · {formatCompact(spent)} spent</p>
      <div className="mt-3 flex gap-2">
        {filters.map(([id, label]) => (
          <Link key={label} href={id ? `/rides?status=${id}` : '/rides'} className={`rounded-full px-3 py-1 text-[13px] font-bold ${(!params.status && !id) || params.status === id ? 'bg-[#1F5BFF] text-white' : 'bg-white text-[#0B1B3B]'}`}>{label}</Link>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
        {rides.length === 0 ? <EmptyState title="No trips yet" body="Pay a fare from Home and it will show up here." /> : null}
        {rides.map((ride, index) => (
          <Link key={ride.id} href={`/receipt/${ride.id}`} className={`block ${index > 0 ? 'border-t border-[rgba(15,26,20,0.08)]' : ''}`}>
            <ListRow
              icon={<BusIcon className="h-5 w-5" />}
              title={<>Bus {ride.fleetNumber}</>}
              meta={`${ride.route} · ${ride.whenLabel}`}
              amount={formatCompact(ride.amountNgwee)}
              trailing={<span className="sr-only">{ride.status === 'pending' ? ride.code : ride.status}</span>}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
