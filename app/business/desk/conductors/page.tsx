import { TerminateConductorForm } from '@/components/terminate-conductor-form';
import { requireUser } from '@/lib/auth';
import { RegisterConductorForm } from '@/components/owner-forms';
import { formatPhone } from '@/lib/phone';
import { listConductors, listOwnerBuses } from '@/lib/service';

export const metadata = { title: 'Conductors' };

export default async function ConductorsPage() {
  const user = await requireUser(['operator']);
  const conductors = await listConductors(user.id, true);
  const buses = await listOwnerBuses(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Conductors</h1>
      <p className="text-sm text-[#5C6B63]">Add a conductor and assign them to one bus. They sign in with the phone and PIN you set.</p>
      <RegisterConductorForm buses={buses} />
      <ul className="space-y-2">
        {conductors.map((conductor) => (
          <li key={conductor.id} className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">{conductor.shortName}</span>
                <span className="text-sm text-[#5C6B63]">{formatPhone(conductor.phone)}</span>
              </span>
              <span className={`rounded-full px-2 py-1 text-[12px] font-bold ${conductor.busFleet ? 'bg-[#E8F8EF] text-[#128A4E]' : 'bg-[#F4F6FB] text-[#5C6578]'}`}>{conductor.closesAt ? (conductor.closesAt <= Date.now() ? 'Closed' : 'Closure scheduled') : conductor.busFleet ? `Bus ${conductor.busFleet}` : 'Unassigned'}</span>
            </div>
            {!conductor.closesAt && <TerminateConductorForm conductorId={conductor.id} name={conductor.shortName} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
