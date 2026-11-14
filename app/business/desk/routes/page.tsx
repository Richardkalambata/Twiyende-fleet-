import { requireUser } from '@/lib/auth';
import { formatGrouped } from '@/lib/money';
import { listOwnerBuses } from '@/lib/service';

export const metadata = { title: 'Routes and fares' };

export default async function RoutesPage() {
  const user = await requireUser(['operator']);
  const buses = await listOwnerBuses(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Routes & fares</h1>
      <p className="text-sm text-[#5C6B63]">Each bus carries the route painted on its side and the fare passengers pay.</p>
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
