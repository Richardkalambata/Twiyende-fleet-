import Link from 'next/link';
import { listPassengerRides, listSupport } from '@/lib/service';
import { requireUser } from '@/lib/auth';
import { supportAction } from '@/lib/actions';
import { SupportForm } from '@/components/account-forms';

export const metadata = { title: 'Help' };

const FAQ = [
  ['How do I pay?', 'Top up your wallet, enter the bus number, and show the fare code to the conductor.'],
  ['How long is a code valid?', 'Three hours, and only on the bus you paid for. A code works once.'],
  ['I left something on the bus.', 'Open Lost & found, pick the trip, and describe the item. You will get a pickup code when it is found.'],
  ['Are payments real?', 'Top-ups are simulated. No mobile-money charge is sent. SMS is recorded, not delivered.'],
];

export default async function HelpPage() {
  const user = await requireUser(['passenger']);
  const [rides, tickets] = await Promise.all([listPassengerRides(user.id), listSupport(user.id, 'passenger')]);
  return (
    <div className="safe-top space-y-4 px-5 pb-8 text-[#0B1B3B]">
      <h1 className="text-[32px] font-extrabold tracking-[-0.04em]">Help</h1>
      <ul className="divide-y divide-[#E6EAF2] rounded-2xl bg-white">
        {FAQ.map(([q, a]) => (
          <li key={q} className="px-4 py-3">
            <p className="font-bold">{q}</p>
            <p className="mt-1 text-[14px] text-[#5C6578]">{a}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-extrabold">Contact support</h2>
        {rides.length ? <SupportForm action={supportAction} rides={rides} /> : <p className="mt-2 text-sm">After you take a ride, you can contact its operator here.</p>}
      </section>
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">My support conversations</h2>
        {tickets.length ? <ul className="mt-2 divide-y divide-[#E6EAF2]">{tickets.map((ticket) => <li key={ticket.id}>
          <Link href={`/help/support/${ticket.id}`} className="block py-3 text-sm text-[#184BDE]">
            <strong>{ticket.subject}</strong> · {ticket.company ?? 'Support'} · {ticket.status === 'open' ? 'Open' : 'Closed'}
          </Link>
        </li>)}</ul> : <p className="mt-2 text-sm">No conversations yet.</p>}
      </section>
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. SMS is not sent.</p>
    </div>
  );
}
