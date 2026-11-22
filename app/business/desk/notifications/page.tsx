import Link from 'next/link';
import { NotificationList } from '@/components/notification-list';
import { syncExpiredFleetShifts } from '@/lib/tracking';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { countOpenLost, listNotifications, operatorDailySummary } from '@/lib/service';

export const metadata = { title: 'Fleet notifications' };

export default async function FleetNotifications() {
  const user = await requireUser(['operator']);
  await syncExpiredFleetShifts(user.id);
  const [summary, open, notices] = await Promise.all([operatorDailySummary(user.id), countOpenLost(user.id), listNotifications(user.id)]);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-bold">Fleet notifications</h1>
      <NotificationList notices={notices} />
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">Daily fare summary</h2>
        <p className="text-sm">{summary.date} · Zambia time</p>
        <p className="mt-2 text-xl font-bold">{formatBalance(summary.amount)} · {summary.rides} complete rides</p>
        <p className="mt-1 text-sm text-[#5C6578]">Yesterday’s complete fares. The summary changes at midnight Zambia time.</p>
      </section>
      <Link href="/business/desk/lost" className="block rounded-2xl bg-white p-4 font-semibold text-[#184BDE]">
        {open ? `${open} open lost-item reports` : 'No open lost-item reports'} →
      </Link>
    </div>
  );
}
