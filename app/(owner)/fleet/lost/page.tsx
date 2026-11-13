import { requireUser } from '@/lib/auth';
import { categoryLabel } from '@/lib/categories';
import { PickupClose } from '@/components/owner-forms';
import { listOwnerLost } from '@/lib/service';

export const metadata = { title: 'Lost & found' };

export default async function OwnerLostPage() {
  const user = await requireUser(['owner']);
  const items = await listOwnerLost(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Lost & found</h1>
      <p className="text-sm text-[#5C6B63]">New reports alert you and the conductor. Close a pickup only when the passenger reads their code.</p>
      <PickupClose />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-3xl bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{categoryLabel(item.category)} · Bus {item.fleetNumber}</p>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#E8833A]">{item.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="text-sm text-[#5C6B63]">{item.description}</p>
            <p className="text-xs text-[#8A918C]">{item.passenger ?? 'Found on the bus'} · {item.whenLabel}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
