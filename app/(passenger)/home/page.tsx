import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { PayForm } from '@/components/pay-form';
import { Bell } from '@/components/bell';
import { BusIcon } from '@/components/icons';
import { Avatar, Wordmark } from '@/components/shell';
import { formatBalance, formatCompact } from '@/lib/money';
import { getPassengerHome } from '@/lib/service';

export default async function HomePage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  return (
    <div>
      <div className="bg-gradient-to-b from-[#07281C] to-[#0A3A28] px-4 pb-5 pt-4 text-white">
        <header className="flex items-center justify-between gap-3">
          <Wordmark tone="light" />
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <div className="text-[13px] text-white/75">Muli bwanji,</div>
              <div className="text-[15px] font-semibold">{home.user.shortName}</div>
            </div>
            <Avatar initials={home.user.initials} />
            <Bell notices={home.notices} />
          </div>
        </header>
        <section className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#16724C] via-[#0C5A3C] to-[#083828] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 180" aria-hidden>
            <g fill="none" stroke="rgba(232,184,96,0.45)" strokeWidth="1.2">
              <path d="M250 16l16 16-16 16-16-16zM286 28l14 14-14 14-14-14zM248 52l12 12-12 12-12-12zM300 64l16 16-16 16-16-16z" />
            </g>
            <path d="M0 150c40-18 70-8 110-16s70-4 110 8 80 6 140-12" stroke="rgba(255,255,255,0.18)" fill="none" />
            <path d="M0 164c50-16 90-6 130-14s80 2 120 12 70 4 110-10" stroke="rgba(255,255,255,0.12)" fill="none" />
          </svg>
          <div className="relative flex items-start justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#E8833A] text-xs">T</span> Twende</span>
            <Link href="/topup" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#E8833A] px-3 text-sm font-semibold">
              Top up <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-base leading-none">+</span>
            </Link>
          </div>
          <p className="relative mt-7 text-sm text-white/75">Balance</p>
          <p className="relative text-[42px] font-semibold leading-none tracking-tight">{formatBalance(home.balanceNgwee)}</p>
        </section>
      </div>
      <div className="space-y-5 px-4 py-4">
        <PayForm buses={home.buses} />
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recent rides</h2>
            <Link href="/rides" className="text-sm text-[#6A756E]">View all ›</Link>
          </div>
          <div className="space-y-2">
            {home.rides.length === 0 ? <p className="text-sm text-[#5C6B63]">Your rides will show up here.</p> : null}
            {home.rides.map((ride) => (
              <Link key={ride.id} href={ride.status === 'pending' ? `/receipt/${ride.id}` : '/rides'} className="flex items-center gap-3 rounded-3xl bg-white px-3 py-3 shadow-[0_8px_24px_rgba(20,36,28,0.04)]">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E7F3EC] text-[#0B5D3B]"><BusIcon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">Bus {ride.fleetNumber}</span>
                    <RidePill status={ride.status} />
                  </span>
                  <span className="block truncate text-sm text-[#6A756E]">{ride.route}</span>
                  <span className="block text-xs text-[#8A918C]">{ride.whenLabel}</span>
                </span>
                <span className="font-semibold">{formatCompact(ride.amountNgwee)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RidePill({ status }: { status: string }) {
  if (status === 'pending') return <span className="rounded-full bg-[#FFF1E6] px-2 py-0.5 text-[11px] font-semibold text-[#C2611E]">Show code</span>;
  if (status === 'void') return <span className="rounded-full bg-[#F1EEE8] px-2 py-0.5 text-[11px] font-semibold text-[#6A756E]">Cancelled</span>;
  return <span className="rounded-full bg-[#E7F6EE] px-2 py-0.5 text-[11px] font-semibold text-[#0B5D3B]">Completed</span>;
}
