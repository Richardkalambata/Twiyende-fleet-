'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bus, Clock, Info, ShieldCheck } from 'lucide-react';
import { shouldSendFix } from '@/lib/tracking-math';
import { createBusPin } from './bus-pin';
import { formatHour24 } from '@/lib/time';

type Shift = {
  sharing: boolean;
  busId?: string;
  fleet?: string;
  route?: string;
  startedAt?: number;
  verified?: number;
  lat?: number | null;
  lng?: number | null;
};

export function ShiftBar() {
  const [shift, setShift] = useState<Shift>({ sharing: false });
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const watch = useRef<number | null>(null);
  const last = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const mini = useRef<HTMLDivElement>(null);
  const miniMap = useRef<import('maplibre-gl').Map | null>(null);
  const miniPin = useRef<import('maplibre-gl').Marker | null>(null);
  const pointRef = useRef<{ lat: number; lng: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  function stopWatch() {
    if (watch.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
  }

  const beginWatch = useCallback((busId: string) => {
    stopWatch();
    if (!navigator.geolocation) {
      setNote('This phone cannot share its location.');
      return;
    }
    watch.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude, at: Date.now() };
        setNote(null);
        if (last.current && !shouldSendFix(last.current, next, next.at)) return;
        setHere({ lat: next.lat, lng: next.lng });
        last.current = next;
        void fetch(`/api/buses/${busId}/location`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            lat: next.lat,
            lng: next.lng,
            heading: position.coords.heading,
            speed: position.coords.speed,
            accuracy: position.coords.accuracy,
          }),
        });
      },
      (error) => {
        setNote(error.code === error.PERMISSION_DENIED
          ? 'Location is off. Allow it for this site, then try again. Passengers cannot see the bus until you share.'
          : 'The phone could not find a location. Try again in a moment.');
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }, []);

  useEffect(() => {
    let gone = false;
    void fetch('/api/shifts').then(async (response) => {
      if (!response.ok || gone) return;
      const body = await response.json() as Shift;
      setShift(body);
      if (body.lat != null && body.lng != null) setHere({ lat: body.lat, lng: body.lng });
      if (body.sharing && body.busId) beginWatch(body.busId);
    }).catch(() => undefined);
    return () => {
      gone = true;
      stopWatch();
    };
  }, [beginWatch]);

  pointRef.current = here ?? (shift.lat != null && shift.lng != null ? { lat: shift.lat, lng: shift.lng } : pointRef.current);

  useEffect(() => {
    if (!shift.sharing) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [shift.sharing]);

  useEffect(() => {
    const node = mini.current;
    if (!node || !shift.sharing) return;
    let dead = false;
    void import('maplibre-gl').then(async (maplibre) => {
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (dead || !mini.current) return;
      const start = pointRef.current ?? { lat: -15.416, lng: 28.283 };
      const map = new maplibre.Map({
        container: mini.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [start.lng, start.lat],
        zoom: 13,
        interactive: false,
        attributionControl: false,
      });
      const { element: el } = createBusPin(shift.fleet ?? '');
      el.dataset.on = 'true';
      miniPin.current = new maplibre.Marker({ element: el, anchor: 'center' }).setLngLat([start.lng, start.lat]).addTo(map);
      miniMap.current = map;
    });
    return () => {
      dead = true;
      miniMap.current?.remove();
      miniMap.current = null;
      miniPin.current = null;
    };
  }, [shift.sharing, shift.fleet]);

  useEffect(() => {
    const point = here;
    if (!point) return;
    const place = () => {
      if (!miniMap.current || !miniPin.current) return false;
      miniPin.current.setLngLat([point.lng, point.lat]);
      miniMap.current.jumpTo({ center: [point.lng, point.lat] });
      return true;
    };
    if (place()) return;
    const timer = window.setInterval(() => { if (place()) window.clearInterval(timer); }, 200);
    return () => window.clearInterval(timer);
  }, [here]);

  async function toggle() {
    setPending(true);
    setNote(null);
    if (shift.sharing) {
      stopWatch();
      await fetch('/api/shifts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'end' }) });
      setShift({ sharing: false });
      setPending(false);
      return;
    }
    const response = await fetch('/api/shifts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    const body = await response.json() as Shift & { error?: string };
    setPending(false);
    if (!response.ok) {
      setNote(body.error ?? 'Could not start the shift.');
      return;
    }
    setShift({ ...body, sharing: true, verified: body.verified ?? 0, startedAt: body.startedAt ?? Date.now() });
    if (body.busId) beginWatch(body.busId);
  }

  const elapsed = shift.startedAt ? formatElapsed(now - shift.startedAt) : '';
  const arrow = shift.route?.replace(' to ', ' → ') ?? '';

  if (!shift.sharing) {
    return (
      <div className="bg-[#F4F6FB] px-5 py-3 text-[#0B1B3B]">
        <button type="button" className="press h-11 rounded-xl bg-[#1F5BFF] px-4 text-[14px] font-bold text-white disabled:opacity-50" disabled={pending} onClick={() => void toggle()}>Start shift</button>
        {note ? <p className="mt-2 text-[13px] leading-5 text-[#5C6578]">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="bg-[#F4F6FB] px-4 py-3 text-[#0B1B3B]">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-[13px] font-extrabold shadow-sm">Bus {shift.fleet}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8EF] px-3 py-1 text-[12px] font-bold text-[#0E7A45]"><i className="h-2 w-2 rounded-full bg-[#12B76A]" /> Sharing location</span>
      </div>
      <section className="mt-3 overflow-hidden rounded-[24px] bg-[#0B1B3B] text-white">
        <div className="flex items-center gap-3 px-4 pt-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1F5BFF] text-white"><Bus className="h-5 w-5" /></span>
          <div>
            <p className="text-[18px] font-extrabold leading-tight">On shift since {shift.startedAt ? formatHour24(shift.startedAt) : 'now'}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-[#D5DCEC]">{arrow}</p>
          </div>
        </div>
        <div ref={mini} className="mx-4 mt-3 h-40 overflow-hidden rounded-2xl bg-[#16305C]" />
        <div className="grid grid-cols-2 gap-2 p-4">
          <article className="rounded-2xl bg-white p-3 text-[#0B1B3B]">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[#5C6578]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#E7EEFF] text-[#1F5BFF]"><ShieldCheck className="h-4 w-4" /></span> Fares verified</p>
            <p className="mt-2 text-[28px] font-extrabold leading-none">{shift.verified ?? 0}</p>
          </article>
          <article className="rounded-2xl bg-white p-3 text-[#0B1B3B]">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[#5C6578]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#E7EEFF] text-[#1F5BFF]"><Clock className="h-4 w-4" /></span> Shift time</p>
            <p className="mt-2 text-[28px] font-extrabold leading-none">{elapsed}</p>
          </article>
        </div>
      </section>
      <button type="button" className="press mt-3 h-12 w-full rounded-xl border border-[#E5484D] bg-white text-[16px] font-bold text-[#E5484D]" disabled={pending} onClick={() => void toggle()}>End shift</button>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#5C6578]"><Info className="h-3.5 w-3.5" /> Location is shared only while your shift is on.</p>
      {note ? (
        <p className="mt-2 text-[13px] leading-5 text-[#5C6578]">
          {note}{' '}
          {shift.busId ? <button type="button" className="font-bold text-[#1F5BFF]" onClick={() => beginWatch(shift.busId!)}>Retry</button> : null}
        </p>
      ) : null}
    </div>
  );
}

function formatElapsed(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}
