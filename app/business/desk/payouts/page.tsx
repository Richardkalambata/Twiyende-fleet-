import { requireUser } from '@/lib/auth';
import { PayoutForms } from '@/components/owner-forms';
import { formatBalance, formatGrouped } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { formatRideWhen } from '@/lib/time';
import { getPayoutSummary, networkDisplay } from '@/lib/service';

export const metadata = { title: 'Payouts' };

export default async function PayoutsPage() {
  const user = await requireUser(['operator']);
  const summary = await getPayoutSummary(user.id);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Payouts</h1>
      <p className="text-sm text-[#5C6B63]">Verified fares collect here. Payouts are simulated until a mobile-money or bank aggregator is connected. Pricing is not decided, so no fee is taken.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Available" value={formatBalance(summary.availableNgwee)} />
        <Stat label="Today" value={formatGrouped(summary.todayNgwee)} />
        <Stat label="Next payout" value={formatGrouped(summary.nextPayoutNgwee)} />
      </div>
      <PayoutForms phone={summary.payoutPhone ?? user.phone} network={summary.payoutNetwork ?? 'mtn'} today={formatGrouped(summary.todayNgwee)} />
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">History</h2>
        {summary.history.length === 0 ? <p className="mt-2 text-sm text-[#5C6B63]">No payouts yet. Today’s takings stay available.</p> : null}
        <ul className="mt-2 divide-y divide-[#F0EBE3]">
          {summary.history.map((payout) => (
            <li key={payout.id} className="flex items-center justify-between py-3 text-sm">
              <span>{formatBalance(payout.amountNgwee)} · {networkDisplay(payout.network)} · {formatPhone(payout.destination)}</span>
              <span className="text-[#6A756E]">{formatRideWhen(payout.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-[13px] text-[#6B7570]">{label}</p>
      <p className="num mt-2 text-[24px] font-semibold tracking-tight">{value}</p>
    </article>
  );
}
