import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { categoryLabel } from '@/lib/categories';
import { buttonClass } from '@/components/shell';
import { EmptyState } from '@/components/ui';
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
  const items = await listPassengerLost(user.id);
  const found = items.find((item) => item.status === 'pickup_pending');
  return (
    <div className="safe-top px-5 pb-6">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Lost & found</h1>
      <p className="text-sm text-[#5C6B63]">Report something from a trip you already paid for.</p>
      {found ? (
        <Link href={`/lost/${found.id}`} className="mt-4 block rounded-3xl bg-[#1F5BFF] p-4 text-white">
          <p className="text-sm text-white/80">Good news</p>
          <p className="text-xl font-semibold">Your {found.category} was found</p>
          <p className="text-sm text-white/80">Bus {found.fleetNumber} · open the pickup code</p>
        </Link>
      ) : null}
      <Link href="/lost/new" className={`${buttonClass('copper')} mt-4`}>Report lost item</Link>
      {items.length === 0 ? <div className="mt-4"><EmptyState title="Nothing reported" body="If you leave something on a bus, report it from the trip and we will track it here." /></div> : null}
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/lost/${item.id}`} className="block rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
              <span className="flex items-center justify-between gap-2">
                <span className="font-bold">{categoryLabel(item.category)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${item.status === 'pickup_pending' ? 'bg-[#E8F8EF] text-[#128A4E]' : item.status === 'not_found' ? 'bg-[#FDECEC] text-[#C53434]' : 'bg-[#FFF6E8] text-[#C47B12]'}`}>{STATUS[item.status] ?? item.status}</span>
              </span>
              <span className="mt-1 block text-[14px] text-[#5C6578]">{item.description}</span>
              <span className="mt-1 block text-[12px] text-[#8A93A6]">Bus {item.fleetNumber} · {item.whenLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
