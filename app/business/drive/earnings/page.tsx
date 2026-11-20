import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { getConductorEarnings } from '@/lib/service';

export const metadata = { title: 'Earnings reports' };

export default async function EarningsPage() {
  const user = await requireUser(['conductor']);
  const earnings = await getConductorEarnings(user.id);
  return (
    <div className="safe-top mx-auto max-w-5xl space-y-4 px-5 pb-6">
      <Link href="/business/drive/trips" className="inline-flex min-h-10 items-center text-sm font-bold text-[#184BDE]">← Today’s trips</Link>
      <h1 className="text-[28px] font-extrabold">Earnings reports</h1>
      <section>
        <p className="text-sm text-[#5C6578]">Fares collected for the fleet and personal tips are shown separately.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {earnings.map((period) => (
            <article key={period.label} className="rounded-2xl bg-white p-4">
              <h3 className="font-bold">{period.label}</h3>
              <p className="mt-1 text-lg font-extrabold">{formatBalance(period.fares)}</p>
              <p className="text-sm text-[#5C6578]">Fares collected · {period.rides} rides</p>
              <p className="mt-2 text-sm font-semibold">Your tips {formatBalance(period.tips)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
