import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { CancelFare, ShareReceipt } from '@/components/receipt-actions';
import { BusIcon, CheckIcon, ClockIcon, UserIcon } from '@/components/icons';
import { buttonClass, Wordmark } from '@/components/shell';
import { formatBalance } from '@/lib/money';
import { formatHour24 } from '@/lib/time';
import { getReceipt } from '@/lib/service';

export const metadata = { title: 'Payment successful' };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['passenger']);
  const { id } = await params;
  const receipt = await getReceipt(user.id, id);
  if (!receipt) notFound();
  const share = `Twende receipt\nBus ${receipt.fleetNumber} · ${receipt.route}\nFare: ${formatBalance(receipt.amountNgwee)}\nCode: ${receipt.code}\nShow this code to your conductor.`;
  const headline = receipt.status === 'void' ? 'Fare cancelled' : receipt.status === 'verified' ? 'Fare confirmed' : 'Payment successful';
  return (
    <div className="px-4 pb-8 pt-5">
      <header className="flex items-center justify-between">
        <Wordmark subtitle="Minibus · Zambia" />
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-[#E4DDD2]" aria-label="Profile"><UserIcon /></Link>
      </header>
      <div className="mt-8 flex justify-center">
        <span className="check-pop grid h-24 w-24 place-items-center rounded-full bg-[#E7F6EE] text-[#0B5D3B] shadow-[0_0_0_10px_rgba(11,93,59,0.06)]">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#0B5D3B] text-white"><CheckIcon className="h-8 w-8" /></span>
        </span>
      </div>
      <h1 className="mt-5 text-center text-[30px] font-semibold tracking-tight">{headline}</h1>
      <p className="mt-1 text-center text-sm text-[#5C6B63]">
        {receipt.status === 'pending' ? 'Your ride is confirmed. Thanks for riding with Twende.' : receipt.status === 'verified' ? 'The conductor has marked this code used.' : 'The fare was returned to your wallet.'}
      </p>
      <section className="ticket mt-5 px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">Bus {receipt.fleetNumber} <BusIcon className="inline h-4 w-4" /></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6A756E]">Fare,</p>
            <p className="font-semibold text-[#E8833A]">{formatBalance(receipt.amountNgwee)}</p>
          </div>
        </div>
        <div className="my-4 border-t border-dashed border-[#E4DDD2]" />
        <p className="text-center text-[11px] font-semibold tracking-[0.16em] text-[#8A918C]">CONFIRMATION CODE</p>
        <p className="mt-3 text-center text-[44px] font-semibold tracking-[0.18em] text-[#0B5D3B]">
          {receipt.status === 'void' ? '————' : receipt.code}
        </p>
        <p className="mt-1 text-center text-sm text-[#5C6B63]">
          {receipt.status === 'pending' ? 'Show this code to your conductor' : receipt.status === 'verified' ? 'Code used' : 'Code cancelled'}
        </p>
        <div className="my-4 border-t border-dashed border-[#E4DDD2]" />
        <div className="flex items-center justify-between text-sm text-[#5C6B63]">
          <span>Valid for this trip</span>
          <span className="inline-flex items-center gap-1"><ClockIcon className="h-4 w-4" /> {formatHour24(receipt.createdAt)}</span>
        </div>
      </section>
      <div className="mt-3 flex items-center justify-between rounded-3xl bg-white px-4 py-4 shadow-sm">
        <span className="text-[#5C6B63]">New balance</span>
        <span className="text-xl font-semibold text-[#E8833A]">{formatBalance(receipt.balanceNgwee)}</span>
      </div>
      <Link href="/home" className={`${buttonClass('green')} mt-4`}>Done</Link>
      {receipt.status === 'pending' ? <ShareReceipt text={share} /> : null}
      {receipt.status === 'pending' ? <CancelFare rideId={receipt.id} /> : null}
    </div>
  );
}
