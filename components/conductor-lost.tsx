'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logFoundAction, markFoundAction, markNotFoundAction, verifyPickupAction } from '@/lib/actions';
import { CONDUCTOR_CATEGORIES, categoryLabel } from '@/lib/categories';
import { fileToPhoto } from '@/lib/image';
import type { ConductorAlert, ConductorItem } from '@/lib/types';
import { BusIcon, CameraIcon, CategoryIcon, CheckIcon, CloseIcon, MenuIcon } from './icons';
import { buttonClass } from './shell';

export function ConductorLostBoard({
  fleetNumber,
  alerts,
  items,
}: {
  fleetNumber: string | null;
  alerts: ConductorAlert[];
  items: ConductorItem[];
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState('phone');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [pickup, setPickup] = useState('');

  async function run(key: string, task: () => Promise<{ ok: boolean; message: string }>) {
    setPending(key);
    setError(null);
    const result = await task();
    setPending(null);
    if (!result.ok) setError(result.message);
    else {
      setMessage(result.message);
      if (key === 'log') {
        setDescription('');
        setPhoto(null);
      }
      if (key === 'pickup') setPickup('');
    }
    router.refresh();
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#E8833A]">Twende Conductor</p>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Menu" onClick={() => setMenu((value) => !value)}>
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>
      {menu ? (
        <div className="mt-2 rounded-2xl bg-[#1C2622] p-2 text-sm">
          <a className="block rounded-xl px-3 py-3" href="/business/drive">Verify codes</a>
          <a className="block rounded-xl px-3 py-3" href="/business/drive/trips">Today’s trips</a>
          <a className="block rounded-xl px-3 py-3" href="/business/drive/profile">Profile & sign out</a>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3"><BusIcon className="h-4 w-4" /> Bus {fleetNumber ?? '—'}</span>
      </div>
      <h1 className="mt-4 text-[34px] font-semibold tracking-tight">Lost & found</h1>
      <p className="text-sm text-[#1DB972]">Help keep things moving.</p>

      {alerts.map((alert) => (
        <article key={alert.id} className="mt-4 rounded-3xl border border-[#E8833A]/70 bg-[#2A1C12] p-4 shadow-[0_0_30px_rgba(232,131,58,0.18)]">
          <p className="text-sm font-semibold text-[#E8833A]">New report · {categoryLabel(alert.category)}</p>
          <p className="mt-1 text-[15px]">{alert.description} · {alert.tripLabel} trip</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1DB972] font-semibold text-[#062117]" disabled={pending === alert.id} onClick={() => run(alert.id, () => markFoundAction(alert.id))}>
              <CheckIcon className="h-4 w-4" /> Found it
            </button>
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1C2622] font-semibold" disabled={pending === `${alert.id}-no`} onClick={() => run(`${alert.id}-no`, () => markNotFoundAction(alert.id))}>
              <CloseIcon className="h-4 w-4" /> Not found
            </button>
          </div>
        </article>
      ))}

      <h2 className="mt-6 text-lg font-semibold">Log a found item</h2>
      <p className="text-sm text-[#8B978F]">Document something left behind.</p>
      <div className="mt-3 grid grid-cols-[120px_1fr] gap-2">
        <label className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-white/20 bg-[#14201B] text-center text-xs text-[#B7C2BA]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : <span><CameraIcon className="mx-auto h-6 w-6" />Take photo<br />(optional)</span>}
          <input type="file" accept="image/*" className="sr-only" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try { setPhoto(await fileToPhoto(file)); } catch { setError('Could not read that photo.'); }
          }} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONDUCTOR_CATEGORIES.map((id) => (
            <button key={id} type="button" onClick={() => setCategory(id)} className={`flex h-12 items-center gap-2 rounded-xl px-2 text-left text-xs ${category === id ? 'bg-[#1DB972] text-[#062117]' : 'bg-[#1C2622]'}`}>
              <CategoryIcon id={id} className="h-4 w-4" /> {categoryLabel(id)}
            </button>
          ))}
        </div>
      </div>
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Short description"
        aria-label="Found item description"
        className="mt-2 h-12 w-full rounded-2xl bg-[#1C2622] px-4 outline-none"
      />
      <button type="button" className={`${buttonClass('mint')} mt-3`} disabled={pending === 'log'} onClick={() => run('log', () => logFoundAction({ category, description, photo }))}>
        {pending === 'log' ? 'Saving…' : 'Save item'}
      </button>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Items on this bus</h2>
      </div>
      <ul className="mt-2 space-y-2">
        {items.length === 0 ? <li className="text-sm text-[#8B978F]">Nothing logged yet.</li> : null}
        {items.map((item) => (
          <li key={item.id} className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#1A221E] px-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8833A]/15 text-[#E8833A]"><CategoryIcon id={item.category} className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{categoryLabel(item.category)}</span>
              <span className="block truncate text-xs text-[#8B978F]">{item.meta}</span>
            </span>
            <span className="text-xs text-[#E8833A]">{item.status === 'pickup_pending' ? 'Pickup pending' : item.status === 'waiting' ? 'Waiting' : 'Closed'}</span>
          </li>
        ))}
      </ul>

      <form className="mt-4 rounded-2xl bg-[#1A221E] p-3" onSubmit={(event) => { event.preventDefault(); void run('pickup', () => verifyPickupAction(pickup)); }}>
        <label className="text-sm font-medium" htmlFor="pickup-code">Passenger is here? Enter pickup code</label>
        <div className="mt-2 flex gap-2">
          <input id="pickup-code" value={pickup} onChange={(event) => setPickup(event.target.value.toUpperCase())} maxLength={4} className="h-14 min-w-0 flex-1 rounded-2xl bg-[#111614] px-4 tracking-[0.2em] outline-none" />
          <button type="submit" className="h-14 rounded-full bg-[#1DB972] px-4 font-semibold text-[#062117]" disabled={pending === 'pickup'}>Close</button>
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-[#1DB972]" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#FFB089]" role="alert">{error}</p> : null}
    </div>
  );
}
