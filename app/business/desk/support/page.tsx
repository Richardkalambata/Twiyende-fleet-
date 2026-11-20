import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listSupport } from '@/lib/service';

export const metadata = { title: 'Support' };

export default async function SupportPage() {
  const user = await requireUser(['operator']);
  const tickets = await listSupport(user.id, 'operator');
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-bold">Support tickets</h1>
      <ul className="divide-y divide-[#E6EAF2] rounded-2xl bg-white">
        {tickets.map((ticket) => <li key={ticket.id}><Link href={`/business/desk/support/${ticket.id}`} className="flex justify-between gap-3 p-4">
          <span><strong>{ticket.subject}</strong><br /><span className="text-sm text-[#5C6578]">{ticket.name}</span></span>
          <span className="text-sm font-semibold">{ticket.status === 'open' ? 'Open' : 'Closed'}</span>
        </Link></li>)}
        {!tickets.length ? <li className="p-4 text-sm">No support tickets yet.</li> : null}
      </ul>
    </div>
  );
}
