'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LiveBus } from '@/lib/tracking';
import { routeGeometry } from '@/lib/lusaka-routes';
import { etaMinutes, formatAgo, formatEta } from '@/lib/tracking-math';

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
  const [trail, setTrail] = useState<[number, number][]>([]);

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
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
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
      const shown = data.buses.filter((bus) => route === 'all' || bus.route === route);
      const seen = new Set<string>();
      for (const bus of shown) {
        seen.add(bus.id);
        const current = markers.current.get(bus.id);
        const next: [number, number] = [bus.lng, bus.lat];
        if (!current) {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'bus-pin';
          el.innerHTML = `<span class="bus-dot">${busIcon()}</span><span class="bus-label">${bus.fleet}</span>`;
          el.addEventListener('click', () => setSelected(bus.id));
          const marker = new maplibre.Marker({ element: el, anchor: 'bottom' }).setLngLat(next).addTo(map);
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
  }, [data.buses, route, selected]);

  useEffect(() => {
    if (mode !== 'operator' || !selected || !mapRef.current) return;
    let cancelled = false;
    void fetch(`/api/buses/${selected}/trail`).then(async (response) => {
      if (!response.ok || cancelled) return;
      const body = await response.json() as { points: { lat: number; lng: number }[] };
      const line = body.points.map((point) => [point.lng, point.lat] as [number, number]);
      setTrail(line);
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;
      const source = map.getSource('trail') as import('maplibre-gl').GeoJSONSource | undefined;
      const geo = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: line } };
      if (source) source.setData(geo);
      else {
        map.addSource('trail', { type: 'geojson', data: geo });
        map.addLayer({ id: 'trail', type: 'line', source: 'trail', paint: { 'line-color': '#1F5BFF', 'line-width': 4, 'line-opacity': 0.8 } });
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [mode, selected, data.now]);

  const routes = [...new Set(data.buses.map((bus) => bus.route))];
  const bus = data.buses.find((item) => item.id === selected) ?? null;
  const routeStops = data.stops.find((item) => item.route === bus?.route)?.stops ?? [];
  const stop = routeStops.find((item) => item.id === stopId) ?? routeStops[0];
  const minutes = bus && stop ? etaMinutes(routeGeometry(bus.route)?.points ?? [], bus, stop, bus.speed) : null;

  function nearMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14 });
    });
  }

  return (
    <div className="relative">
      <div className="relative">
      <div ref={holder} className="h-[62vh] w-full md:h-[calc(100dvh-7rem)]" />
      <div className="absolute left-3 right-16 top-3 flex gap-2 overflow-x-auto">
        <button type="button" className={`chip shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${route === 'all' ? 'bg-[#1F5BFF] text-white' : 'bg-white text-[#0B1B3B]'}`} data-on={route === 'all'} onClick={() => setRoute('all')}>All</button>
        {routes.map((name) => (
          <button key={name} type="button" data-on={route === name} className={`chip shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${route === name ? 'bg-[#1F5BFF] text-white' : 'bg-white text-[#0B1B3B]'}`} onClick={() => setRoute(name)}>{name}</button>
        ))}
      </div>
      {mode === 'rider' ? <button type="button" className="press absolute bottom-4 right-3 rounded-full bg-[#0B1B3B] px-3 py-2 text-[12px] font-bold text-white" onClick={nearMe}>Near me</button> : null}
      </div>
      <ul className={`grid gap-2 bg-[#F4F6FB] p-3 ${mode === 'operator' ? 'md:absolute md:inset-y-0 md:right-0 md:w-80 md:overflow-y-auto' : ''}`}>
        {data.buses.filter((item) => route === 'all' || item.route === route).map((item) => (
          <li key={item.id}>
            <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-[#0B1B3B]" onClick={() => setSelected(item.id)}>
              <span><span className="block text-[15px] font-extrabold">Bus {item.fleet}</span><span className="text-[12px] text-[#5C6578]">{item.route}</span></span>
              <span className={`text-[12px] font-bold ${item.stale ? 'text-[#C47B12]' : item.onShift ? 'text-[#0E7A45]' : 'text-[#5C6578]'}`}>{item.stale ? 'Stale' : item.onShift ? 'On shift' : 'Idle'}</span>
            </button>
          </li>
        ))}
      </ul>
      {bus ? (
        <div className="sheet fixed inset-x-3 bottom-24 z-30 rounded-[24px] p-4 text-[#0B1B3B] shadow-[0_16px_40px_rgba(11,27,59,0.16)] md:absolute md:bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1F5BFF]">Bus {bus.fleet}</p>
              <h2 className="text-[22px] font-extrabold">{bus.route}</h2>
            </div>
            <button type="button" className="text-[13px] font-bold text-[#5C6578]" onClick={() => setSelected(null)}>Close</button>
          </div>
          <p className="mt-1 text-[14px] text-[#5C6578]">Last seen {bus.recordedAt ? formatAgo(bus.recordedAt, data.now) : 'not yet'}{bus.speed ? ` · ${Math.round(bus.speed * 3.6)} km/h` : ''}</p>
          {mode === 'operator' ? <p className="mt-1 text-[14px] font-semibold">{bus.conductor ? `Conductor ${bus.conductor}` : 'No conductor assigned'}</p> : null}
          {mode === 'operator' && trail.length > 1 ? <p className="mt-1 text-[13px] text-[#5C6578]">Today’s path is on the map.</p> : null}
          {mode === 'rider' && routeStops.length > 0 ? (
            <>
              <label className="mt-3 block text-[12px] font-bold text-[#5C6578]">Stop
                <select className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-[15px] font-semibold text-[#0B1B3B]" value={stop?.id ?? ''} onChange={(event) => setStopId(event.target.value)}>
                  {routeStops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              {minutes != null ? <p className="mt-3 text-[28px] font-extrabold text-[#1F5BFF]">{formatEta(minutes)}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function busIcon() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M6 17v2M18 17v2M4 11h16"/></svg>';
}
