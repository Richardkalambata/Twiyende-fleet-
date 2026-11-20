import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { readSupportThread } from '@/lib/service';
import { SupportThread } from '@/components/support-thread';

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['passenger']);
  const { id } = await params;
  const ticket = await readSupportThread(user.id, 'passenger', id);
  if (!ticket) notFound();
  return (
    <div className="safe-top mx-auto max-w-3xl space-y-4 px-4 pb-8 pt-5">
      <Link href="/help" className="text-sm font-bold text-[#184BDE]">← Support</Link>
      <h1 className="break-words text-2xl font-bold">{ticket.subject}</h1>
      <SupportThread id={id} status={ticket.operator_id ? ticket.status : 'closed'} viewer={user.id} operator={false} messages={ticket.messages} />
    </div>
  );
}
