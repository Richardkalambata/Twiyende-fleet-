import { requireUser } from '@/lib/auth';
import { BusControls, RegisterBusForm } from '@/components/owner-forms';
import { StatusPill } from '@/components/owner-frame';
import { formatGrouped } from '@/lib/money';
import { listConductors, listOwnerBuses } from '@/lib/service';

export const metadata = { title: 'Buses' };

export default async function BusesPage() {
  const user = await requireUser(['owner']);
  const buses = listOwnerBuses(user.id);
  const conductors = listConductors(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Buses</h1>
      <p className="text-sm text-[#5C6B63]">Register a bus by the fleet number painted on the minibus. Demo data.</p>
      <RegisterBusForm />
      <div className="space-y-3">
        {buses.map((bus) => (
          <article key={bus.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Bus {bus.fleetNumber}</h2>
                <p className="text-sm text-[#5C6B63]">{bus.plate} · {bus.route}</p>
                <p className="mt-1 text-sm">{formatGrouped(bus.earningsNgwee)} · {bus.rides} rides today</p>
              </div>
              <StatusPill status={bus.status} />
            </div>
            <div className="mt-3"><BusControls bus={bus} conductors={conductors} /></div>
          </article>
        ))}
      </div>
    </div>
  );
}
