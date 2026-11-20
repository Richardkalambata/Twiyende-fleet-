import { requireUser } from '@/lib/auth';
import { supportAction } from '@/lib/actions';
import { SupportForm } from '@/components/account-forms';

export const metadata = { title: 'Help' };

const FAQ = [
  ['How do I pay?', 'Top up your wallet, enter the bus number, and show the 4-character code to the conductor.'],
  ['How long is a code valid?', 'Three hours, and only on the bus you paid for. A code works once.'],
  ['I left something on the bus.', 'Open Lost & found, pick the trip, and describe the item. You will get a pickup code when it is found.'],
  ['Are payments real?', 'Top-ups are simulated. No mobile-money charge is sent. SMS is recorded, not delivered.'],
];

export default async function HelpPage() {
  await requireUser(['passenger']);
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
        <SupportForm action={supportAction} />
      </section>
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. SMS is not sent.</p>
    </div>
  );
}
