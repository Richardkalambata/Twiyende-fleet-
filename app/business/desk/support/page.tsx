import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { replySupportAction } from '@/lib/actions';
import { listSupport } from '@/lib/service';

export const metadata = { title: 'Support' };

export default async function SupportPage() {
  const user = await requireUser(['operator']);
  const tickets = await listSupport(user.id);
  return (
    <div className="space-y-3 px-4 py-5 text-[#0B1B3B] md:px-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Support</h1>
      {tickets.length === 0 ? <p className="text-sm text-[#5C6578]">No tickets yet.</p> : null}
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{ticket.subject}</h2>
            <span className="text-[12px] font-semibold uppercase text-[#5C6578]">{ticket.status}</span>
          </div>
          <p className="text-[13px] text-[#5C6578]">{ticket.name}</p>
          <p className="mt-2 text-[14px]">{ticket.body}</p>
          {ticket.status === 'open' ? (
            <form action={replySupportAction} className="mt-3 space-y-2">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea name="body" required aria-label="Reply" className="h-20 w-full rounded-xl bg-white px-3 py-2 text-[#0B1B3B] placeholder:text-[#5C6578]" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="close" /> Close ticket</label>
              <button className="h-10 rounded-xl bg-[#1F5BFF] px-4 text-sm font-bold text-white">Reply</button>
            </form>
          ) : null}
        </article>
      ))}
      <Link href="/business/desk" className="text-sm font-semibold text-[#1F5BFF]">Back to overview</Link>
    </div>
  );
}
