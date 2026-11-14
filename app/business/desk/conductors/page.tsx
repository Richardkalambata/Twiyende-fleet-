import { requireUser } from '@/lib/auth';
import { RegisterConductorForm } from '@/components/owner-forms';
import { formatPhone } from '@/lib/phone';
import { listConductors, listOwnerBuses } from '@/lib/service';

export const metadata = { title: 'Conductors' };

export default async function ConductorsPage() {
  const user = await requireUser(['operator']);
  const conductors = await listConductors(user.id);
  const buses = await listOwnerBuses(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Conductors</h1>
      <p className="text-sm text-[#5C6B63]">Add a conductor and assign them to one bus. They sign in with the phone and PIN you set.</p>
      <RegisterConductorForm buses={buses} />
      <ul className="space-y-2">
        {conductors.map((conductor) => (
          <li key={conductor.id} className="flex min-h-16 items-center justify-between rounded-3xl bg-white px-4 shadow-sm">
            <span>
              <span className="block font-semibold">{conductor.shortName}</span>
              <span className="text-sm text-[#5C6B63]">{formatPhone(conductor.phone)}</span>
            </span>
            <span className="text-sm">{conductor.busFleet ? `Bus ${conductor.busFleet}` : 'Unassigned'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
