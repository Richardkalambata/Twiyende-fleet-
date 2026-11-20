import { requireUser } from '@/lib/auth';
import { ConductorAssignmentForm } from '@/components/owner-forms';
import { listAssignments, listConductors, listOwnerBuses } from '@/lib/service';

export const metadata = { title: 'Assignments' };

export default async function AssignmentsPage() {
  const user = await requireUser(['operator']);
  const [buses, conductors, assignments] = await Promise.all([
    listOwnerBuses(user.id),
    listConductors(user.id),
    listAssignments(user.id),
  ]);
  const onBus = new Map(assignments.map((row) => [row.bus_id, row.conductor_id]));
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Today’s assignments</h1>
      <p className="text-sm text-[#5C6B63]">A conductor only verifies codes for the bus they are on today.</p>
      <div className="space-y-3">
        {buses.map((bus) => (
          <article key={bus.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="font-semibold">Bus {bus.fleetNumber}</h2><p className="text-sm">{bus.route ?? 'No route entered'}</p></div>
            <ConductorAssignmentForm bus={{ ...bus, conductorId: onBus.get(bus.id) ?? null }} conductors={conductors} />
          </article>
        ))}
      </div>
    </div>
  );
}
