import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { categoryLabel } from '@/lib/categories';
import { FoundActions } from '@/components/found-actions';
import { Bell } from '@/components/bell';
import { CheckIcon, PinIcon } from '@/components/icons';
import { getPassengerHome, getPassengerLostItem } from '@/lib/service';

export const metadata = { title: 'Item found' };

export default async function LostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['passenger']);
  const { id } = await params;
  const item = await getPassengerLostItem(user.id, id);
  if (!item) notFound();
  const ready = item.status === 'pickup_pending' || item.status === 'closed';
  return (
    <div>
      <div className="safe-top bg-[#0B5D3B] px-5 pb-8 text-white">
        <header className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8833A] font-bold">T</span>
            <span>
              <span className="block font-semibold leading-tight">Twende</span>
              <span className="block text-[11px] text-white/70">Transit · Zambia</span>
            </span>
          </span>
          <Bell notices={(await getPassengerHome(user.id)).notices} tone="light" />
        </header>
      </div>
      <div className="-mt-4 space-y-3 px-4 pb-8">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8833A] text-white"><CheckIcon className="h-5 w-5" /></span>
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
              {ready ? 'Good news!' : 'Report update'}
              <span className="block">{ready ? `Your ${item.category} was found` : `${categoryLabel(item.category)} · ${item.status.replaceAll('_', ' ')}`}</span>
            </h1>
            <p className="mt-2 text-sm text-[#5C6B63]">
              {ready ? 'We matched your report with an item found on a minibus.' : item.description}
            </p>
          </div>
        </div>
        {ready ? (
          <>
            <article className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
              {item.photoData ? (
                // Passenger photos are data URLs, so they skip the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photoData} alt="" className="h-24 w-28 rounded-2xl object-cover" />
              ) : (
                <PhoneArt category={item.category} />
              )}
              <div className="min-w-0 py-1">
                <p className="font-semibold">Found on Bus {item.fleetNumber}</p>
                <p className="text-sm text-[#5C6B63]">by conductor {item.conductorName ?? 'the crew'}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#E7F6EE] px-2 py-1 text-xs font-semibold text-[#0B5D3B]">
                  <CheckIcon className="h-3.5 w-3.5" /> {item.status === 'closed' ? 'Picked up' : 'Verified'}
                </span>
              </div>
            </article>
            <section className="ticket px-4 py-4 text-center">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#8A918C]">PICKUP CODE</p>
              <p className="mt-1 text-5xl font-semibold tracking-[0.12em] text-[#143028]">{item.pickupCode}</p>
              <p className="mt-2 text-sm text-[#5C6B63]"><PinIcon className="mr-1 inline h-4 w-4" /> Show this code at pickup</p>
            </section>
            <Link href="/lost" className="flex min-h-16 items-center gap-3 rounded-3xl bg-white px-4 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F3EC] text-[#0B5D3B]"><PinIcon /></span>
              <span>
                <span className="block text-xs text-[#6A756E]">Pick up at</span>
                <span className="block font-semibold">{item.pickupPlace}</span>
                <span className="block text-sm text-[#6A756E]">{item.pickupUntilLabel}</span>
              </span>
            </Link>
            {item.smsSent ? <p className="text-center text-xs text-[#6A756E]">Pickup code queued by SMS to your phone.</p> : null}
            <FoundActions
              itemId={item.id}
              tipNgwee={item.tipNgwee}
              balanceNgwee={item.balanceNgwee}
              place={item.pickupPlace ?? 'Town bus stage Lusaka'}
              conductorPhone={item.conductorPhone}
            />
          </>
        ) : (
          <article className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{item.description}</p>
            <p className="mt-2 text-sm text-[#5C6B63]">Bus {item.fleetNumber} · {item.route}</p>
            <Link href="/lost/new" className="mt-4 inline-flex text-sm font-semibold text-[#0B5D3B]">Report something else</Link>
          </article>
        )}
      </div>
    </div>
  );
}

function PhoneArt({ category }: { category: string }) {
  return (
    <div className="grid h-24 w-28 place-items-center rounded-2xl bg-gradient-to-br from-[#1C2A24] to-[#0E1814]" aria-hidden>
      <div className={`h-14 w-8 rounded-lg ${category === 'phone' ? 'bg-[#2E6BFF] shadow-[0_8px_16px_rgba(0,0,0,0.35)]' : 'bg-[#E8833A]'} `} />
    </div>
  );
}
