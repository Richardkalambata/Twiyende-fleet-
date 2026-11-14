import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { BusIcon } from '@/components/icons';
import { EmptyState, ListRow } from '@/components/ui';
import { formatCompact } from '@/lib/money';
import { listPassengerRides } from '@/lib/service';

export const metadata = { title: 'Rides' };

export default async function RidesPage() {
  const user = await requireUser(['passenger']);
  const rides = await listPassengerRides(user.id);
  return (
    <div className="safe-top px-5 pb-6">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Trips</h1>
      <p className="text-sm text-[#5C6B63]">Fares paid from your Twende wallet.</p>
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
