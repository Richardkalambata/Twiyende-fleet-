import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { CancelFare, ShareReceipt } from '@/components/receipt-actions';
import { TicketWatch, PrintButton } from '@/components/ticket-live';
import { Logo } from '@/components/shell';
import { formatBalance } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { getReceipt } from '@/lib/service';

export const metadata = { title: 'Ride ticket' };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['passenger']);
  const { id } = await params;
  const receipt = await getReceipt(user.id, id);
  if (!receipt) notFound();
  const parts = receipt.route.split(/ to | – | - /i);
  const from = parts[0] ?? receipt.route;
  const to = parts[1] ?? receipt.route;
  const pending = receipt.status === 'pending';
  const share = `Twende ${receipt.code} Bus ${receipt.fleetNumber} ${formatBalance(receipt.amountNgwee)}`;
  return (
    <div className="safe-top px-5 pb-8 text-[#0B1B3B]">
      <Link href="/home" className="text-2xl" aria-label="Back">←</Link>
      <div className="mt-2 flex items-center justify-between"><Logo /><span className="text-[12px] text-[#8A93A6]">{formatHour24(receipt.createdAt)}</span></div>
      <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.04em]">{pending ? 'Your ride ticket' : 'Ride receipt'}</h1>
      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        <div className="bg-[#0B1B3B] px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-extrabold">BUS {receipt.fleetNumber}</span>
            <span className="text-[18px] font-extrabold">{formatBalance(receipt.amountNgwee)}</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-[#E8833A]" />
        </div>
        <div className="px-4 py-5">
          <TicketWatch id={receipt.id} initial={receipt.status} code={receipt.code} />
        </div>
        <div className="space-y-3 border-t border-dashed border-[#E4E8F0] px-4 py-4 text-[14px]">
          <div className="flex justify-between"><span className="text-[#5C6578]">Departure</span><span className="font-semibold">{from}</span></div>
          <div className="flex justify-between"><span className="text-[#5C6578]">Destination</span><span className="font-semibold">{to}</span></div>
          <div className="flex justify-between"><span className="text-[#5C6578]">Fare paid</span><span className="font-semibold">{formatBalance(receipt.amountNgwee)}</span></div>
          <div className="flex justify-between"><span className="text-[#5C6578]">Wallet balance</span><span className="font-semibold">{formatBalance(receipt.balanceNgwee)}</span></div>
        </div>
      </section>
      {pending ? <CancelFare rideId={receipt.id} /> : null}
      <PrintButton />
      {pending ? <ShareReceipt text={share} /> : null}
      <Link href="/lost/new" className="mt-3 block text-center text-[14px] font-semibold text-[#1F5BFF]">Report a lost item</Link>
    </div>
  );
}
