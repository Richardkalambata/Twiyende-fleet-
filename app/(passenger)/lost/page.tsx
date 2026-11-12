import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { categoryLabel } from '@/lib/categories';
import { buttonClass } from '@/components/shell';
import { listPassengerLost } from '@/lib/service';

export const metadata = { title: 'Lost & found' };

const STATUS: Record<string, string> = {
  reported: 'Conductor alerted',
  waiting: 'Logged on the bus',
  not_found: 'Not found yet',
  pickup_pending: 'Ready for pickup',
  closed: 'Picked up',
};

export default async function LostPage() {
  const user = await requireUser(['passenger']);
  const items = listPassengerLost(user.id);
  const found = items.find((item) => item.status === 'pickup_pending');
  return (
    <div className="px-4 py-5">
      <h1 className="text-[32px] font-semibold tracking-tight">Lost & found</h1>
      <p className="text-sm text-[#5C6B63]">Report something from a trip you already paid for.</p>
      {found ? (
        <Link href={`/lost/${found.id}`} className="mt-4 block rounded-3xl bg-[#0B5D3B] p-4 text-white">
          <p className="text-sm text-white/80">Good news</p>
          <p className="text-xl font-semibold">Your {found.category} was found</p>
          <p className="text-sm text-white/80">Bus {found.fleetNumber} · open the pickup code</p>
        </Link>
      ) : null}
      <Link href="/lost/new" className={`${buttonClass('copper')} mt-4`}>Report lost item</Link>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/lost/${item.id}`} className="block rounded-3xl bg-white px-4 py-3 shadow-sm">
              <span className="font-semibold">{categoryLabel(item.category)}</span>
              <span className="mt-1 block text-sm text-[#5C6B63]">{item.description}</span>
              <span className="mt-1 block text-xs text-[#8A918C]">Bus {item.fleetNumber} · {STATUS[item.status] ?? item.status} · {item.whenLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
