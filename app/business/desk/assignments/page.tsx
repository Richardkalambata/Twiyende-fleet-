import { requireUser } from '@/lib/auth';
import { assignShiftAction } from '@/lib/actions';
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
          <form key={bus.id} action={assignShiftAction} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(11,27,59,0.06)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">Bus {bus.fleetNumber}</div>
              <div className="text-sm text-[#5C6B63]">{bus.route}</div>
            </div>
            <input type="hidden" name="busId" value={bus.id} />
            <select name="conductorId" defaultValue={onBus.get(bus.id) ?? ''} className="h-12 w-full rounded-xl bg-white px-3 text-[#0B1B3B] sm:w-56">
              <option value="">Unassigned</option>
              {conductors.map((conductor) => (
                <option key={conductor.id} value={conductor.id}>{conductor.shortName}</option>
              ))}
            </select>
            <button className="h-12 rounded-xl bg-[#1F5BFF] px-4 text-sm font-bold text-white">Save</button>
          </form>
        ))}
      </div>
    </div>
  );
}
