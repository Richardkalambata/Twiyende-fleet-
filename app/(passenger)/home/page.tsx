import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { PayForm } from '@/components/pay-form';
import { Bell } from '@/components/bell';
import { BusIcon, LostIcon, TicketIcon, WalletIcon } from '@/components/icons';
import { Wordmark } from '@/components/shell';
import { Badge, ListRow } from '@/components/ui';
import { formatBalance, formatCompact } from '@/lib/money';
import { getPassengerHome } from '@/lib/service';

export default async function HomePage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-b from-[#073D27] via-[#0B5D3B] to-[#146846] px-5 pb-6 pt-4 text-white">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 360 280" aria-hidden>
          <g fill="none" stroke="#E8B860" strokeWidth="1.1">
            <path d="M210 18l18 18-18 18-18-18zM250 36l14 14-14 14-14-14zM228 70l12 12-12 12-12-12zM270 78l16 16-16 16-16-16zM300 24l10 10-10 10-10-10z" />
          </g>
          <path d="M-10 210c50-24 90-8 140-20s90 4 140 16 90 8 120-16" stroke="white" strokeOpacity="0.25" fill="none" />
          <path d="M-10 232c60-20 100-6 150-16s90 6 140 18 80 6 110-12" stroke="white" strokeOpacity="0.14" fill="none" />
        </svg>
        <header className="relative flex items-center justify-between gap-4">
          <Wordmark tone="light" />
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-[12px] text-white/70">Muli bwanji,</div>
              <div className="text-[15px] font-semibold">{home.user.shortName}</div>
            </div>
            <Portrait initials={home.user.initials} />
            <Bell notices={home.notices} />
          </div>
        </header>
        <section className="relative mt-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1A7A52] via-[#0E5C3C] to-[#073D27] p-5 shadow-[0_16px_40px_rgba(7,61,39,0.28)]">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#E8833A] text-[12px]">T</span> Twende</span>
            <Link href="/topup" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-3 text-[14px] font-semibold backdrop-blur-md ring-1 ring-white/25">
              Top up <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-base leading-none">+</span>
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-white/70">Balance</p>
          <p className="num text-[40px] font-semibold leading-none tracking-tight">{formatBalance(home.balanceNgwee)}</p>
        </section>
      </div>
      <div className="space-y-4 px-5 py-4">
        <section className="grid grid-cols-4 gap-2">
          {([
            ['/home#pay', 'Pay fare', TicketIcon],
            ['/topup', 'Top up', WalletIcon],
            ['/rides', 'Trips', BusIcon],
            ['/lost', 'Lost & found', LostIcon],
          ] as const).map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#E7F3EC] text-[#0B5D3B] shadow-[0_1px_2px_rgba(7,61,39,0.06)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="whitespace-nowrap text-center text-[12px] font-medium tracking-[-0.02em] text-[#0F1A14]">{label}</span>
            </Link>
          ))}
        </section>
        <div id="pay"><PayForm buses={home.buses} /></div>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-semibold">Recent rides</h2>
            <Link href="/rides" className="text-[13px] font-medium text-[#6B7570]">View all</Link>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            {home.rides.length === 0 ? <p className="px-4 py-6 text-[14px] text-[#6B7570]">Your rides will show up here.</p> : null}
            {home.rides.map((ride, index) => (
              <Link key={ride.id} href={ride.status === 'pending' ? `/receipt/${ride.id}` : '/rides'} className={`block ${index > 0 ? 'border-t border-[rgba(15,26,20,0.08)]' : ''}`}>
                <ListRow
                  icon={<BusIcon className="h-5 w-5" />}
                  title={<><span>Bus {ride.fleetNumber}</span> <RidePill status={ride.status} /></>}
                  meta={`${ride.route} · ${ride.whenLabel}`}
                  amount={formatCompact(ride.amountNgwee)}
                />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[20px] font-semibold">Popular routes</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {home.buses.filter((bus) => bus.status === 'active').slice(0, 4).map((bus) => (
              <div key={bus.fleetNumber} className="min-w-[148px] rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="text-[14px] font-semibold">Bus {bus.fleetNumber}</div>
                <div className="mt-1 text-[12px] text-[#6B7570]">{bus.route}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Portrait({ initials }: { initials: string }) {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F4E4D4] text-[13px] font-semibold text-[#073D27] ring-2 ring-white/70" aria-hidden>
      {initials.slice(0, 2)}
    </span>
  );
}

function RidePill({ status }: { status: string }) {
  if (status === 'pending') return <Badge tone="copper">Show code</Badge>;
  if (status === 'void') return <Badge tone="muted">Cancelled</Badge>;
  return <Badge>Completed</Badge>;
}
