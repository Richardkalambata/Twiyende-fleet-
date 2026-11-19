'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LiveBus } from '@/lib/tracking';
import { routeGeometry } from '@/lib/lusaka-routes';
import { etaMinutes, formatAgo, formatEta, formatUpdated } from '@/lib/tracking-math';

type Stop = { id: string; name: string; lat: number; lng: number; seq: number };
type Payload = { buses: LiveBus[]; stops: { route: string; stops: Stop[] }[]; now: number };

export function LiveMap({ mode }: { mode: 'rider' | 'operator' }) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const markers = useRef(new Map<string, { marker: import('maplibre-gl').Marker; from: [number, number]; to: [number, number]; started: number }>());
  const [data, setData] = useState<Payload>({ buses: [], stops: [], now: Date.now() });
  const [route, setRoute] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [stopId, setStopId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let dead = false;
    let timer = 0;
    const load = async () => {
      if (document.hidden) return;
      const response = await fetch('/api/buses/live');
      if (!response.ok || dead) return;
      const body = await response.json() as Payload;
      setData(body);
    };
    const loop = () => {
      void load();
      timer = window.setTimeout(loop, 10_000);
    };
    loop();
    const onShow = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onShow);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, []);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    let map: import('maplibre-gl').Map | null = null;
    let dead = false;
    void import('maplibre-gl').then((maplibre) => {
      if (dead || !holder.current) return;
      map = new maplibre.Map({
        container: holder.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [28.283, -15.416],
        zoom: 12,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-left');
      mapRef.current = map;
    });
    const bag = markers.current;
    return () => {
      dead = true;
      map?.remove();
      mapRef.current = null;
      bag.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let frame = 0;
    const paint = (now: number) => {
      markers.current.forEach((item) => {
        const t = Math.min(1, (now - item.started) / 10_000);
        const lng = item.from[0] + (item.to[0] - item.from[0]) * t;
        const lat = item.from[1] + (item.to[1] - item.from[1]) * t;
        item.marker.setLngLat([lng, lat]);
      });
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [data.buses]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    void import('maplibre-gl').then((maplibre) => {
      if (cancelled || !mapRef.current) return;
      const shown = data.buses.filter((bus) => (route === 'all' || bus.route === route) && (!search.trim() || `bus ${bus.fleet} ${bus.route}`.toLowerCase().includes(search.trim().toLowerCase())));
      const seen = new Set<string>();
      for (const bus of shown) {
        seen.add(bus.id);
        const current = markers.current.get(bus.id);
        const next: [number, number] = [bus.lng, bus.lat];
        if (!current) {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = mode === 'operator' ? 'fleet-pin' : 'bus-pin';
          if (mode === 'operator') {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.setAttribute('aria-hidden', 'true');
            dot.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 10h16M7 16v2M17 16v2"/></svg>';
            const num = document.createElement('span');
            num.className = 'num';
            num.textContent = bus.fleet;
            el.append(dot, num);
          } else {
            el.textContent = bus.fleet;
          }
          el.addEventListener('click', () => setSelected(bus.id));
          const marker = new maplibre.Marker({ element: el, anchor: 'center' }).setLngLat(next).addTo(map);
          markers.current.set(bus.id, { marker, from: next, to: next, started: performance.now() });
        } else {
          const at = current.marker.getLngLat();
          current.from = [at.lng, at.lat];
          current.to = next;
          current.started = performance.now();
        }
        const element = markers.current.get(bus.id)?.marker.getElement();
        if (element) {
          element.dataset.stale = bus.stale ? 'true' : 'false';
          element.dataset.idle = bus.onShift ? 'false' : 'true';
          element.dataset.on = selected === bus.id ? 'true' : 'false';
        }
      }
      for (const [id, item] of markers.current) {
        if (!seen.has(id)) {
          item.marker.remove();
          markers.current.delete(id);
        }
      }
    });
    return () => { cancelled = true; };
  }, [data.buses, route, search, selected, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const chosen = data.buses.find((item) => item.id === selected);
    const line = chosen ? routeGeometry(chosen.route)?.points.map((point) => [point.lng, point.lat] as [number, number]) : [];
    const draw = () => {
      if (!map.isStyleLoaded()) return;
      const geo = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: line ?? [] } };
      const source = map.getSource('route-line') as import('maplibre-gl').GeoJSONSource | undefined;
      if (source) source.setData(geo);
      else if (line && line.length > 1) {
        map.addSource('route-line', { type: 'geojson', data: geo });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route-line', paint: { 'line-color': '#1F5BFF', 'line-width': 5, 'line-opacity': 0.9 } });
      }
    };
    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [selected, data.buses]);

  useEffect(() => {
    if (selected && data.buses.some((item) => item.id === selected)) return;
    const preferred = data.buses.find((item) => item.fleet === '12')
      ?? data.buses.find((item) => item.onShift && !item.stale)
      ?? data.buses[0];
    if (preferred) setSelected(preferred.id);
  }, [data.buses, selected]);

  const routes = [...new Set(data.buses.map((bus) => bus.route))];
  const bus = data.buses.find((item) => item.id === selected) ?? null;
  const routeStops = data.stops.find((item) => item.route === bus?.route)?.stops ?? [];
  const stop = routeStops.find((item) => item.id === stopId) ?? routeStops[routeStops.length - 1];
  const minutes = bus && stop ? etaMinutes(routeGeometry(bus.route)?.points ?? [], bus, stop, bus.speed) : null;
  const query = search.trim().toLowerCase();
  const visible = data.buses.filter((item) => {
    if (route !== 'all' && item.route !== route) return false;
    if (!query) return true;
    return `bus ${item.fleet} ${item.route}`.toLowerCase().includes(query);
  });
  const onShift = data.buses.filter((item) => item.onShift && !item.stale).length;
  const idle = data.buses.filter((item) => !item.onShift && !item.stale).length;
  const stale = data.buses.filter((item) => item.stale).length;
  const arrow = bus ? bus.route.replace(' to ', ' → ') : '';

  function nearMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14 });
    });
  }

  const chipLabel = (name: string) => {
    const match = data.buses.find((item) => item.route === name);
    const short = name.replace(' to ', '–');
    return match ? `Bus ${match.fleet} • ${short}` : short;
  };

  return (
    <div className="relative h-full">
      <div ref={holder} className={mode === 'rider' ? 'h-[calc(100dvh-88px)] w-full' : 'h-[62vh] w-full md:h-dvh'} />
      {mode === 'rider' ? (
        <label className="absolute left-3 right-3 top-3 z-10">
          <span className="sr-only">Where are you going?</span>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6578]" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Where are you going?" className="h-12 w-full rounded-full border border-[#E4E8F0] bg-white pl-11 pr-4 text-[15px] font-semibold text-[#0B1B3B] shadow-[0_8px_24px_rgba(11,27,59,0.1)] placeholder:text-[#8A93A6]" />
        </label>
      ) : (
        <div className="absolute left-3 top-3 z-10 flex gap-3 rounded-2xl bg-white px-3 py-2 text-[12px] font-bold text-[#0B1B3B] shadow-[0_8px_24px_rgba(11,27,59,0.1)]">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#12B76A]" /> On shift <span className="text-[#5C6578]">{onShift}</span></span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#8A93A6]" /> Idle <span className="text-[#5C6578]">{idle}</span></span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E8A317]" /> Stale <span className="text-[#5C6578]">{stale}</span></span>
        </div>
      )}
      <div className={`absolute left-3 right-16 z-10 flex gap-2 overflow-x-auto ${mode === 'rider' ? 'top-[68px]' : 'top-[60px]'}`}>
        <button type="button" data-on={route === 'all'} className="chip shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B1B3B] shadow-[0_6px_16px_rgba(11,27,59,0.1)]" onClick={() => setRoute('all')}>All</button>
        {routes.map((name) => (
          <button key={name} type="button" data-on={route === name} className="chip shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B1B3B] shadow-[0_6px_16px_rgba(11,27,59,0.1)]" onClick={() => { setRoute(name); const match = data.buses.find((item) => item.route === name); if (match) setSelected(match.id); }}>{chipLabel(name)}</button>
        ))}
      </div>
      {mode === 'rider' && !bus ? <button type="button" className="press absolute bottom-6 right-3 z-10 rounded-full bg-[#0B1B3B] px-3 py-2 text-[12px] font-bold text-white" onClick={nearMe}>Near me</button> : null}
      {mode === 'operator' ? (
        <aside className="relative z-10 bg-[#F4F6FB] p-3 md:absolute md:inset-y-3 md:right-3 md:w-[340px] md:overflow-y-auto md:rounded-[24px] md:bg-white md:p-4 md:shadow-[0_16px_40px_rgba(11,27,59,0.12)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold">Nearby buses</h2>
          </div>
          <p className="text-[12px] text-[#5C6578]">Sorted by last update</p>
          <ul className="mt-3 space-y-2">
            {[...visible].sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0)).map((item) => (
              <li key={item.id}>
                <button type="button" className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${selected === item.id ? 'bg-[#E7EEFF]' : 'bg-white md:bg-[#F4F6FB]'}`} onClick={() => setSelected(item.id)}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1F5BFF] text-[12px] font-extrabold text-white">{item.fleet}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">Bus {item.fleet}</span>
                    <span className={`text-[12px] font-bold ${item.stale ? 'text-[#C47B12]' : item.onShift ? 'text-[#0E7A45]' : 'text-[#5C6578]'}`}>{item.conductor ? `${item.conductor} · ` : ''}{item.stale ? 'Stale' : item.onShift ? 'On shift' : 'Idle'}</span>
                  </span>
                  <span className="text-right text-[12px] font-semibold text-[#5C6578]">
                    <span className="block text-[14px] font-extrabold text-[#0B1B3B]">{item.speed ? `${Math.round(item.speed * 3.6)} km/h` : '—'}</span>
                    {item.recordedAt ? formatAgo(item.recordedAt, data.now) : 'No update'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      {mode === 'rider' && bus ? (
        <div className="sheet fixed inset-x-3 bottom-24 z-30 rounded-[28px] p-4 text-[#0B1B3B] shadow-[0_18px_40px_rgba(11,27,59,0.16)] md:absolute md:inset-x-auto md:bottom-4 md:left-3 md:w-[420px]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E7EEFF] text-[#1F5BFF]" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="12" rx="2" /><path d="M4 10h16M7 16v2M17 16v2" /></svg>
            </span>
            <div>
              <p className="text-[18px] font-extrabold leading-none">Bus {bus.fleet}</p>
              <p className="mt-1 text-[15px] font-semibold text-[#3E4A63]">{arrow}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="shrink-0 whitespace-nowrap text-[40px] font-extrabold leading-none tracking-[-0.04em]">{minutes != null ? formatEta(minutes) : '~—'}</p>
            <Link href={`/home?bus=${bus.fleet}`} className="press inline-flex h-12 shrink items-center gap-2 rounded-xl bg-[#1F5BFF] px-3 text-[13px] font-bold leading-tight text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></svg>
              Pay fare for Bus {bus.fleet}
            </Link>
          </div>
          <p className="mt-1 text-[14px] text-[#5C6578]">to {stop?.name ?? 'the next stop'}</p>
          {routeStops.length > 1 ? (
            <select aria-label="Stop" className="mt-3 h-11 w-full rounded-xl bg-[#F4F6FB] px-3 text-[15px] font-semibold text-[#0B1B3B]" value={stop?.id ?? ''} onChange={(event) => setStopId(event.target.value)}>
              {routeStops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          ) : null}
          <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C6578]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>
            {bus.recordedAt ? formatUpdated(bus.recordedAt, data.now) : 'Waiting for a position'}
          </p>
        </div>
      ) : null}
    </div>
  );
}

