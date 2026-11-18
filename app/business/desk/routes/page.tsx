import { requireUser } from '@/lib/auth';
import { addFareAction } from '@/lib/actions';
import { formatGrouped } from '@/lib/money';
import { listOwnerBuses, listRouteFares } from '@/lib/service';

export const metadata = { title: 'Routes and fares' };

export default async function RoutesPage() {
  const user = await requireUser(['operator']);
  const buses = await listOwnerBuses(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Routes & fares</h1>
      <form action={addFareAction} className="flex flex-wrap gap-2 rounded-2xl bg-white p-4">
        <input name="route" required placeholder="Route" aria-label="Route" className="h-11 flex-1 rounded-xl bg-white px-3 text-[#0B1B3B] placeholder:text-[#5C6578]" />
        <input name="amount" required placeholder="Fare in K" aria-label="Fare" className="h-11 w-32 rounded-xl bg-white px-3 text-[#0B1B3B] placeholder:text-[#5C6578]" />
        <button className="h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white">Add fare</button>
      </form>
      <ul className="text-sm">
        {(await listRouteFares(user.id)).map((fare) => (
          <li key={fare.id} className="border-b border-[#E6EAF2] py-2">{fare.route} · {formatGrouped(fare.amount_ngwee)}</li>
        ))}
      </ul>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <table className="data">
          <thead>
            <tr>
              <th className="px-4">Bus</th>
              <th>Route</th>
              <th>Plate</th>
              <th className="num px-4">Today</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((bus) => (
              <tr key={bus.id}>
                <td className="px-4 font-semibold">{bus.fleetNumber}</td>
                <td>{bus.route}</td>
                <td>{bus.plate}</td>
                <td className="num px-4">{formatGrouped(bus.earningsNgwee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
