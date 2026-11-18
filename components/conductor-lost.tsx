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
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1F5BFF]">Twende Conductor</p>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-[#F1F4FA] text-[#0B1B3B]" aria-label="Menu" onClick={() => setMenu((value) => !value)}>
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>
      {menu ? (
        <div className="mt-2 rounded-2xl bg-white p-2 text-sm text-[#0B1B3B] shadow-[0_8px_24px_rgba(11,27,59,0.08)]">
          <a className="block rounded-xl bg-white px-3 py-3 text-[#0B1B3B]" href="/business/drive">Verify codes</a>
          <a className="block rounded-xl bg-white px-3 py-3 text-[#0B1B3B]" href="/business/drive/trips">Today’s trips</a>
          <a className="block rounded-xl bg-white px-3 py-3 text-[#0B1B3B]" href="/business/drive/profile">Profile & sign out</a>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E4E8F0] bg-[#F1F4FA] px-3 text-[#0B1B3B]"><BusIcon className="h-4 w-4" /> Bus {fleetNumber ?? '—'}</span>
      </div>
      <h1 className="mt-4 text-[34px] font-semibold tracking-tight">Lost & found</h1>
      <p className="text-sm text-[#128A4E]">Help keep things moving.</p>

      {alerts.map((alert) => (
        <article key={alert.id} className="mt-4 rounded-3xl border border-[#1F5BFF]/40 bg-[#EEF3FF] p-4 shadow-[0_0_30px_rgba(232,131,58,0.18)]">
          <p className="text-sm font-semibold text-[#1F5BFF]">New report · {categoryLabel(alert.category)}</p>
          <p className="mt-1 text-[15px]">{alert.description} · {alert.tripLabel} trip</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1F5BFF] font-semibold text-white" disabled={pending === alert.id} onClick={() => run(alert.id, () => markFoundAction(alert.id))}>
              <CheckIcon className="h-4 w-4" /> Found it
            </button>
            <button type="button" className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#E4E8F0] bg-white font-semibold text-[#0B1B3B]" disabled={pending === `${alert.id}-no`} onClick={() => run(`${alert.id}-no`, () => markNotFoundAction(alert.id))}>
              <CloseIcon className="h-4 w-4" /> Not found
            </button>
          </div>
        </article>
      ))}

      <h2 className="mt-6 text-lg font-semibold">Log a found item</h2>
      <p className="text-sm text-[#8B978F]">Document something left behind.</p>
      <div className="mt-3 grid grid-cols-[120px_1fr] gap-2">
        <label className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-[#D5DCE8] bg-[#F4F6FB] text-center text-xs text-[#0B1B3B]">
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
            <button key={id} type="button" onClick={() => setCategory(id)} className={`flex h-12 items-center gap-2 rounded-xl border px-2 text-left text-xs ${category === id ? 'border-[#1F5BFF] bg-[#1F5BFF] text-white' : 'border-[#E4E8F0] bg-[#F1F4FA] text-[#0B1B3B]'}`}>
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
        className="mt-2 h-12 w-full rounded-2xl border border-[#E4E8F0] bg-white px-4 text-[#0B1B3B] outline-none placeholder:text-[#5C6578]"
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
          <li key={item.id} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-3 text-[#0B1B3B]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EEF3FF] text-[#1F5BFF]"><CategoryIcon id={item.category} className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{categoryLabel(item.category)}</span>
              <span className="block truncate text-xs text-[#8B978F]">{item.meta}</span>
            </span>
            <span className="text-xs text-[#1F5BFF]">{item.status === 'pickup_pending' ? 'Pickup pending' : item.status === 'waiting' ? 'Waiting' : 'Closed'}</span>
          </li>
        ))}
      </ul>

      <form className="mt-4 rounded-2xl bg-white p-3 text-[#0B1B3B]" onSubmit={(event) => { event.preventDefault(); void run('pickup', () => verifyPickupAction(pickup)); }}>
        <label className="text-sm font-medium text-[#0B1B3B]" htmlFor="pickup-code">Passenger is here? Enter pickup code</label>
        <div className="mt-2 flex gap-2">
          <input id="pickup-code" value={pickup} onChange={(event) => setPickup(event.target.value.toUpperCase())} maxLength={4} className="h-14 min-w-0 flex-1 rounded-2xl border border-[#E4E8F0] bg-white px-4 text-[#0B1B3B] tracking-[0.2em] outline-none placeholder:text-[#5C6578]" />
          <button type="submit" className="h-14 rounded-full bg-[#1F5BFF] px-4 font-semibold text-white" disabled={pending === 'pickup'}>Close</button>
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-[#128A4E]" role="status">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#FFB089]" role="alert">{error}</p> : null}
    </div>
  );
}
