import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { ridesForExport } from '@/lib/service';

export const metadata = { title: 'Bus collections' };

export default async function BusDayPage({ params }: { params: Promise<{ fleet: string }> }) {
  const user = await requireUser(['operator']);
  const { fleet } = await params;
  const rides = (await ridesForExport(user.id, 'today')).filter((ride) => ride.fleetNumber === fleet && ride.status === 'verified');
  if (!/^\d{1,4}$/.test(fleet)) notFound();
  const total = rides.reduce((sum, ride) => sum + ride.amountNgwee, 0);
  return (
    <div className="space-y-4 px-4 py-5 text-[#0B1B3B] md:px-6">
      <Link href="/business/desk/payouts" className="text-sm font-semibold text-[#1F5BFF]">Payouts</Link>
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Bus {fleet} · today</h1>
      <p className="text-[14px] text-[#5C6578]">{rides.length} complete fares · {formatBalance(total)}</p>
      <ul className="divide-y divide-[#E6EAF2] rounded-2xl bg-white">
        {rides.map((ride) => (
          <li key={ride.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{formatHour24(ride.createdAt)} · {ride.passenger}</span>
            <span className="font-bold">{formatBalance(ride.amountNgwee)}</span>
          </li>
        ))}
        {rides.length === 0 ? <li className="px-4 py-6 text-sm text-[#5C6578]">No complete fares for this bus today.</li> : null}
      </ul>
    </div>
  );
}
