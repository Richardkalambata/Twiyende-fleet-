'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportLostAction } from '@/lib/actions';
import { PASSENGER_CATEGORIES, categoryLabel } from '@/lib/categories';
import { fileToPhoto } from '@/lib/image';
import { formatCompact } from '@/lib/money';
import type { RideCard } from '@/lib/types';
import { BusIcon, CameraIcon, CategoryIcon, PencilIcon, ShieldIcon } from './icons';
import { buttonClass } from './shell';

export function ReportForm({ trips }: { trips: RideCard[] }) {
  const router = useRouter();
  const [rideId, setRideId] = useState(trips[0]?.id ?? '');
  const [openTrips, setOpenTrips] = useState(false);
  const [category, setCategory] = useState('phone');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const trip = trips.find((item) => item.id === rideId) ?? trips[0];

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await fileToPhoto(file));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not add that photo.');
    }
  }

  async function submit() {
    if (!trip) return;
    setPending(true);
    setError(null);
    const result = await reportLostAction({ rideId: trip.id, category, description, photo, notifySms: notify });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(result.matched ? `/lost/${result.itemId}` : '/lost');
    router.refresh();
  }

  if (!trip) {
    return <p className="px-5 text-sm text-[#5C6B63]">Pay a fare first. You can report something lost on that trip afterwards.</p>;
  }

  return (
    <div className="space-y-5 px-4 pb-8">
      <button type="button" className="flex min-h-[72px] w-full items-center gap-3 rounded-3xl bg-white px-3 text-left shadow-sm" onClick={() => setOpenTrips(true)}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#0B5D3B] text-white"><BusIcon /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Bus {trip.fleetNumber}, {trip.route}</span>
          <span className="block text-sm text-[#E8833A]">{trip.whenLabel.replace(', ', ' ')}</span>
          <span className="block text-sm font-semibold">{formatCompact(trip.amountNgwee)}</span>
        </span>
        <span className="pr-2 text-[#8A918C]">›</span>
      </button>
      <section>
        <h2 className="text-lg font-semibold">What did you lose?</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PASSENGER_CATEGORIES.map((id) => {
            const selected = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-medium ${selected ? 'border-[#E8833A] bg-[#FFF4EC] text-[#C2611E]' : 'border-[#E8E2D8] bg-white text-[#5C6B63]'}`}
              >
                <CategoryIcon id={id} className="h-5 w-5" />
                {categoryLabel(id)}
              </button>
            );
          })}
        </div>
      </section>
      <label className="flex h-14 items-center gap-3 rounded-2xl border border-[#E8E2D8] bg-white px-4">
        <input
          aria-label="Description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setError(null);
          }}
          placeholder="Black Samsung phone, blue case"
          className="h-12 min-w-0 flex-1 bg-transparent outline-none"
        />
        <PencilIcon className="h-5 w-5 text-[#E8833A]" />
      </label>
      <label className="block rounded-3xl border border-dashed border-[#E7B089] bg-[#FFF8F3] px-4 py-5 text-center">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Lost item" className="mx-auto mb-3 h-28 rounded-xl object-cover" />
        ) : <CameraIcon className="mx-auto h-7 w-7 text-[#E8833A]" />}
        <span className="mt-2 block font-semibold text-[#E8833A]">Add photo (optional)</span>
        <span className="mt-1 block text-sm text-[#8A5A3A]">Helps the conductor spot it faster</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => onPhoto(event.target.files?.[0])} />
      </label>
      <button type="button" className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-4" onClick={() => setNotify((value) => !value)}>
        <span className="font-medium">Notify me by SMS</span>
        <span className="toggle" data-on={notify}><i /></span>
      </button>
      <p className="flex items-start gap-2 text-sm text-[#3E5348]">
        <ShieldIcon className="mt-0.5 h-5 w-5 text-[#0B5D3B]" />
        We’ll alert the conductor and owner of Bus {trip.fleetNumber}
      </p>
      {error ? <p className="text-sm text-[#9A3B1A]" role="alert">{error}</p> : null}
      <button type="button" className={buttonClass('copper')} disabled={pending} onClick={submit}>
        {pending ? 'Sending…' : 'Report item'} <span aria-hidden>→</span>
      </button>
      {openTrips ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-[430px] rounded-3xl bg-white p-4">
            <h2 className="text-lg font-semibold">Choose the trip</h2>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {trips.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-[#F7F5F0] px-4 text-left"
                  onClick={() => {
                    setRideId(item.id);
                    setOpenTrips(false);
                  }}
                >
                  <span>Bus {item.fleetNumber} · {item.route}</span>
                  <span className="text-sm text-[#5C6B63]">{item.whenLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
