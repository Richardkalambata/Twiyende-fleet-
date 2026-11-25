import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { getBalance, listWalletActivity } from '@/lib/service';
import { formatHour24, formatRideWhen } from '@/lib/time';

export const metadata = { title: 'Transaction history' };
const PAGE_SIZE = 25;

export default async function WalletHistory({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser(['passenger']);
  const requested = Number((await searchParams).page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 1000000) : 1;
  const [balanceNgwee, entries] = await Promise.all([
    getBalance(user.id),
    listWalletActivity(user.id, PAGE_SIZE + 1, (page - 1) * PAGE_SIZE),
  ]);
  return (
    <div className="safe-top w-full px-5 pb-8 lg:px-10">
      <Link href="/home" className="text-sm font-semibold text-[#184BDE]">← Home</Link>
      <h1 className="mt-3 text-3xl font-extrabold">Transaction history</h1>
      <p className="mt-2 text-sm text-[#5C6578]">Current balance <strong className="text-[#0B1B3B]">{formatBalance(balanceNgwee)}</strong></p>
      <ul className="mt-5 divide-y divide-[#E4E8F0] rounded-2xl bg-white px-4">
        {entries.slice(0, PAGE_SIZE).map((entry) => (
          <li key={entry.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-4 text-sm">
            <div>
              <p className="font-bold">{entry.note || (entry.amountNgwee < 0 ? 'Wallet deduction' : 'Wallet credit')}</p>
              <p className="mt-1 text-[#5C6578]">{formatRideWhen(entry.createdAt)} · {formatHour24(entry.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className={entry.amountNgwee >= 0 ? 'font-bold text-[#0E7A45]' : 'font-bold text-[#0B1B3B]'}>
                {entry.amountNgwee < 0 ? '−' : '+'}{formatBalance(Math.abs(entry.amountNgwee))}
              </p>
              <p className="mt-1 text-[#5C6578]">Balance {formatBalance(entry.balanceAfter)}</p>
            </div>
          </li>
        ))}
      </ul>
      {entries.length === 0 ? <p className="mt-4 text-sm text-[#5C6578]">No transactions on this page.</p> : null}
      <div className="mt-4 flex justify-between gap-4 text-sm font-bold text-[#184BDE]">
        {page > 1 ? <Link href={`/wallet?page=${page - 1}`}>Newer transactions</Link> : <span />}
        {entries.length > PAGE_SIZE ? <Link href={`/wallet?page=${page + 1}`}>Older transactions</Link> : null}
      </div>
    </div>
  );
}
