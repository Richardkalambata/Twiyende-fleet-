import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { requireUser } from '@/lib/auth';
import { CancelFare, ShareReceipt } from '@/components/receipt-actions';
import { BusIcon, ClockIcon, UserIcon } from '@/components/icons';
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
  const qr = await QRCode.toDataURL(receipt.code, { margin: 0, width: 128, color: { dark: '#073D27', light: '#00000000' } });
  const headline = receipt.status === 'void' ? 'Fare cancelled' : receipt.status === 'verified' ? 'Fare confirmed' : 'Payment successful';
  return (
    <div className="safe-top px-5 pb-8">
      <header className="flex items-center justify-between">
        <Wordmark subtitle="Minibus · Zambia" />
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-[#E4DDD2]" aria-label="Profile"><UserIcon /></Link>
      </header>
      <div className="mt-8 flex justify-center">
        <span className="check-pop grid h-20 w-20 place-items-center">
          <svg viewBox="0 0 52 52" className="h-20 w-20" aria-hidden>
            <circle cx="26" cy="26" r="24" fill="#0B5D3B" />
            <path className="draw" d="M15 27l7 7 15-16" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
        <div className="mt-3 flex items-center justify-center gap-4">
          <p className="num font-mono text-[40px] font-semibold tracking-[0.18em] text-[#073D27]">
            {receipt.status === 'void' ? '————' : receipt.code}
          </p>
          {receipt.status === 'void' ? null : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="" width={56} height={56} className="h-14 w-14" />
          )}
        </div>
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
