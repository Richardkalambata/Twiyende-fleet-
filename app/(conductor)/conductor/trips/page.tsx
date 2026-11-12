import { requireUser } from '@/lib/auth';
import { formatBalance, formatGrouped } from '@/lib/money';
import { listConductorTrips } from '@/lib/service';

export const metadata = { title: 'Trips' };

export default async function TripsPage() {
  const user = await requireUser(['conductor']);
  const data = listConductorTrips(user.id);
  return (
    <div className="px-4 py-5">
      <h1 className="text-[32px] font-semibold">Trips</h1>
      <p className="text-sm text-[#B7C2BA]">Bus {data.bus?.fleet_number ?? '—'} · {formatGrouped(data.todayNgwee)} · {data.todayRides} rides today</p>
      <ul className="mt-4 space-y-2">
        {data.trips.length === 0 ? <li className="text-sm text-[#8B978F]">No fares confirmed yet today.</li> : null}
        {data.trips.map((trip) => (
          <li key={`${trip.code}-${trip.timeLabel}`} className="flex items-center justify-between rounded-2xl bg-[#1A221E] px-4 py-3">
            <span>
              <span className="block font-semibold">{trip.passenger}</span>
              <span className="text-xs tracking-[0.14em] text-[#8B978F]">{trip.code} · {trip.timeLabel}</span>
            </span>
            <span className="font-semibold text-[#1DB972]">{formatBalance(trip.amountNgwee)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
