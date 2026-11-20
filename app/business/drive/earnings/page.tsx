import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { getConductorEarnings, listConductorPayouts, networkDisplay } from '@/lib/service';

export const metadata = { title: 'Earnings reports' };

export default async function EarningsPage() {
  const user = await requireUser(['conductor']);
  const [earnings, payouts] = await Promise.all([getConductorEarnings(user.id), listConductorPayouts(user.id)]);
  return (
    <div className="safe-top mx-auto max-w-5xl space-y-4 px-5 pb-6">
      <Link href="/business/drive/trips" className="inline-flex min-h-10 items-center text-sm font-bold text-[#184BDE]">← Today’s trips</Link>
      <h1 className="text-[28px] font-extrabold">Earnings reports</h1>
      <section>
        <h2 className="text-lg font-bold">Fares collected</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {earnings.map((period) => (
            <article key={period.label} className="rounded-2xl bg-white p-4">
              <h3 className="font-bold">{period.label}</h3>
              <p className="mt-1 text-lg font-extrabold">{formatBalance(period.fares)}</p>
              <p className="text-sm text-[#5C6578]">Fares collected · {period.rides} rides</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Payouts received</h2>
        <p className="text-sm text-[#5C6578]">Payments recorded by your operators.</p>
        {payouts.length === 0 ? <p className="mt-2 rounded-xl bg-white p-4 text-sm">No payouts recorded yet.</p> : (
          <ul className="mt-2 divide-y divide-[#E4E8F0] rounded-2xl bg-white px-4">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div><p className="font-semibold">{payout.operator_name}</p><time className="text-sm text-[#5C6578]" dateTime={payout.paid_on}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Africa/Lusaka' }).format(new Date(`${payout.paid_on}T12:00:00Z`))}</time></div>
                {payout.network ? <p className="text-sm text-[#5C6578]">{networkDisplay(payout.network)} · {payout.transfer_reference}</p> : null}
                <strong>{formatBalance(payout.amount_ngwee)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
