'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { shouldSendFix } from '@/lib/tracking-math';

type Shift = { sharing: boolean; busId?: string; fleet?: string; route?: string };

export function ShiftBar() {
  const [shift, setShift] = useState<Shift>({ sharing: false });
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const watch = useRef<number | null>(null);
  const last = useRef<{ lat: number; lng: number; at: number } | null>(null);

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
        if (!shouldSendFix(last.current, next, next.at)) return;
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
      if (body.sharing && body.busId) beginWatch(body.busId);
    }).catch(() => undefined);
    return () => {
      gone = true;
      stopWatch();
    };
  }, [beginWatch]);

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
    const body = await response.json() as Shift & { error?: string; busId?: string; fleet?: string };
    setPending(false);
    if (!response.ok) {
      setNote(body.error ?? 'Could not start the shift.');
      return;
    }
    setShift({ sharing: true, busId: body.busId, fleet: body.fleet });
    if (body.busId) beginWatch(body.busId);
  }

  return (
    <div className="bg-[#F4F6FB] px-5 py-3 text-[#0B1B3B]">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="press h-11 rounded-xl bg-[#1F5BFF] px-4 text-[14px] font-bold text-white disabled:opacity-50" disabled={pending} onClick={() => void toggle()}>
          {shift.sharing ? 'End shift' : 'Start shift'}
        </button>
        {shift.sharing ? <span className="rounded-full bg-[#E8F8EF] px-3 py-1 text-[12px] font-bold text-[#0E7A45]">Sharing location{shift.fleet ? ` · Bus ${shift.fleet}` : ''}</span> : null}
      </div>
      {note ? (
        <p className="mt-2 text-[13px] leading-5 text-[#5C6578]">
          {note}{' '}
          {shift.sharing && shift.busId ? <button type="button" className="font-bold text-[#1F5BFF]" onClick={() => beginWatch(shift.busId!)}>Retry</button> : null}
        </p>
      ) : null}
    </div>
  );
}
