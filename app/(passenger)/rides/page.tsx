import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { BusIcon } from '@/components/icons';
import { formatCompact } from '@/lib/money';
import { listPassengerRides } from '@/lib/service';

export const metadata = { title: 'Rides' };

export default async function RidesPage() {
  const user = await requireUser(['passenger']);
  const rides = await listPassengerRides(user.id);
  return (
    <div className="px-4 py-5">
      <h1 className="text-[32px] font-semibold tracking-tight">Rides</h1>
      <p className="text-sm text-[#5C6B63]">Fares paid from your Twende wallet.</p>
      <div className="mt-4 space-y-2">
        {rides.length === 0 ? <p className="rounded-3xl bg-white p-5 text-sm">No rides yet. Pay a fare from Home.</p> : null}
        {rides.map((ride) => (
          <Link key={ride.id} href={`/receipt/${ride.id}`} className="flex items-center gap-3 rounded-3xl bg-white px-3 py-3 shadow-sm">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E7F3EC] text-[#0B5D3B]"><BusIcon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Bus {ride.fleetNumber}</span>
              <span className="block truncate text-sm text-[#6A756E]">{ride.route}</span>
              <span className="text-xs text-[#8A918C]">{ride.whenLabel}</span>
            </span>
            <span className="text-right">
              <span className="block font-semibold">{formatCompact(ride.amountNgwee)}</span>
              <span className="text-xs text-[#0B5D3B]">{ride.status === 'pending' ? ride.code : ride.status === 'void' ? 'Cancelled' : 'Completed'}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
