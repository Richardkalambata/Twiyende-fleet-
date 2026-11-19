'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LiveBus } from '@/lib/tracking';
import { LUSAKA_STREETS, describePlace } from '@/lib/lusaka-places';
import { routeGeometry, type GeoPoint } from '@/lib/lusaka-routes';
import { accuracyRing, approachFromDistances, formatDistance, formatUpdated, haversineMetres, lerpAngle, pointAtDistance, projectOnto, reachMinutes, routeLength, showsAccuracyHalo, snapToRoad, type Approach } from '@/lib/tracking-math';

type Stop = { id: string; name: string; lat: number; lng: number; seq: number };
type Payload = { buses: LiveBus[]; stops: { route: string; stops: Stop[] }[]; landmarks?: Stop[]; now: number };
type YouFix = { lat: number; lng: number; accuracy: number };
type DistanceSample = { at: number; metres: number };
const POLL_MS = 2_000;

type Pin = {
  marker: import('maplibre-gl').Marker;
  arrow: HTMLElement;
  from: [number, number];
  to: [number, number];
  fromHeading: number;
  toHeading: number;
  started: number;
  accuracy: number | null;
  route: GeoPoint[];
  onRoad: boolean;
};

const EMPTY_LINE = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [] as [number, number][] } };
const EMPTY_POINTS = { type: 'FeatureCollection' as const, features: [] as { type: 'Feature'; properties: { name: string }; geometry: { type: 'Point'; coordinates: [number, number] } }[] };

function headingArrow() {
  const arrow = document.createElement('span');
  arrow.className = 'heading-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = '<svg viewBox="0 0 14 10" width="14" height="10"><path d="M7 1 L13 9 H1 Z" fill="#0B1B3B" stroke="#ffffff" stroke-width="1.2"/></svg>';
  return arrow;
}

function usualRoute(route: string) {
  return route.replaceAll(' to ', ' ↔ ');
}

export function LiveMap({ mode }: { mode: 'rider' | 'operator' }) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const markers = useRef(new Map<string, Pin>());
  const youMarker = useRef<import('maplibre-gl').Marker | null>(null);
  const youRef = useRef<YouFix | null>(null);
  const distanceHistory = useRef(new Map<string, DistanceSample[]>());
  const fittedKey = useRef<string | null>(null);
  const followRef = useRef(false);
  const selectedRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [data, setData] = useState<Payload>({ buses: [], stops: [], landmarks: [], now: Date.now() });
  const [route, setRoute] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [follow, setFollow] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  const [you, setYou] = useState<YouFix | null>(null);
  const [locationState, setLocationState] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [historyTick, setHistoryTick] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  followRef.current = follow;
  selectedRef.current = selected;
  youRef.current = you;

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode !== 'rider' || !navigator.geolocation) {
      setLocationState(mode === 'rider' ? 'denied' : 'pending');
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        setLocationState('granted');
        setYou({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 12_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [mode]);

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
      timer = window.setTimeout(loop, POLL_MS);
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
      if (mode !== 'rider') map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-left');
      mapRef.current = map;
      map.on('load', () => {
        if (dead || !map) return;
        for (const layer of map.getStyle().layers ?? []) {
          if (layer.type !== 'symbol') continue;
          if (/path|minor|shield|airport|other|village|water/.test(layer.id)) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
            continue;
          }
          try {
            map.setPaintProperty(layer.id, 'text-color', '#8A93A6');
            map.setPaintProperty(layer.id, 'text-halo-color', '#F7F8FA');
            map.setPaintProperty(layer.id, 'text-halo-width', 1.2);
          } catch {
            // Icon-only symbols have no text paint.
          }
        }
        map.addSource('route-line', { type: 'geojson', data: EMPTY_LINE });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route-line', paint: { 'line-color': '#9AA8C0', 'line-width': 2, 'line-opacity': 0.35 } });
        map.addSource('you-line', { type: 'geojson', data: EMPTY_LINE });
        map.addLayer({
          id: 'you-line',
          type: 'line',
          source: 'you-line',
          paint: { 'line-color': '#A8B0C0', 'line-width': 1.25, 'line-opacity': 0.7, 'line-dasharray': [1, 1.8] },
        });
        map.addSource('stop-dots', { type: 'geojson', data: EMPTY_POINTS });
        map.addLayer({
          id: 'stop-dots',
          type: 'circle',
          source: 'stop-dots',
          paint: { 'circle-radius': 4, 'circle-color': '#0B1B3B', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        });
        map.addSource('accuracy-halo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'accuracy-halo', type: 'fill', source: 'accuracy-halo', paint: { 'fill-color': '#1F5BFF', 'fill-opacity': 0.16 } });
        map.addLayer({ id: 'accuracy-halo-line', type: 'line', source: 'accuracy-halo', paint: { 'line-color': '#1F5BFF', 'line-width': 1.5, 'line-opacity': 0.55 } });
        map.addSource('you-halo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'you-halo', type: 'fill', source: 'you-halo', paint: { 'fill-color': '#0B1B3B', 'fill-opacity': 0.16 } });
        map.addLayer({ id: 'you-halo-line', type: 'line', source: 'you-halo', paint: { 'line-color': '#0B1B3B', 'line-width': 2, 'line-opacity': 0.7 } });
        map.on('dragstart', () => setFollow(false));
        setMapReady(true);
      });
    });
    const bag = markers.current;
    return () => {
      dead = true;
      setMapReady(false);
      map?.remove();
      mapRef.current = null;
      youMarker.current = null;
      bag.clear();
    };
  }, [mode]);

  useEffect(() => {
    if (!mapReady || mode !== 'rider' || !you) return;
    const map = mapRef.current;
    if (!map || youMarker.current) return;
    let dead = false;
    void import('maplibre-gl').then((maplibre) => {
      if (dead || !mapRef.current || !youRef.current || youMarker.current) return;
      const el = document.createElement('div');
      el.className = 'you-pin';
      el.textContent = 'You';
      el.setAttribute('aria-label', 'You');
      youMarker.current = new maplibre.Marker({ element: el, anchor: 'center' })
        .setLngLat([youRef.current.lng, youRef.current.lat])
        .addTo(mapRef.current);
    });
    return () => { dead = true; };
  }, [mapReady, mode, you]);

  useEffect(() => {
    if (you) youMarker.current?.setLngLat([you.lng, you.lat]);
  }, [you]);

  useEffect(() => {
    if (!you) return;
    let changed = false;
    for (const bus of data.buses) {
      const line = routeGeometry(bus.route)?.points ?? [];
      const display = snapToRoad(bus, line, bus.accuracy);
      const metres = haversineMetres(you, display);
      const previous = distanceHistory.current.get(bus.id) ?? [];
      if (previous[previous.length - 1]?.at === bus.recordedAt) continue;
      distanceHistory.current.set(bus.id, [...previous, { at: bus.recordedAt, metres }].slice(-4));
      changed = true;
    }
    if (changed) setHistoryTick((value) => value + 1);
  }, [data.buses, you]);

  useEffect(() => {
    if (!mapReady) return;
    let frame = 0;
    const paint = (now: number) => {
      const map = mapRef.current;
      const features: { type: 'Feature'; properties: Record<string, never>; geometry: { type: 'Polygon'; coordinates: [number, number][][] } }[] = [];
      let followAt: [number, number] | null = null;
      let selectedAt: [number, number] | null = null;
      markers.current.forEach((item, id) => {
        const t = Math.min(1, (now - item.started) / POLL_MS);
        let lng = item.from[0] + (item.to[0] - item.from[0]) * t;
        let lat = item.from[1] + (item.to[1] - item.from[1]) * t;
        let heading = lerpAngle(item.fromHeading, item.toHeading, t);
        if (item.onRoad && item.route.length > 1) {
          const fromAlong = projectOnto(item.route, { lat: item.from[1], lng: item.from[0] }).along;
          let toAlong = projectOnto(item.route, { lat: item.to[1], lng: item.to[0] }).along;
          if (toAlong + 40 < fromAlong) toAlong += routeLength(item.route);
          const spot = pointAtDistance(item.route, fromAlong + (toAlong - fromAlong) * t);
          lng = spot.lng;
          lat = spot.lat;
          heading = spot.heading;
        }
        item.marker.setLngLat([lng, lat]);
        item.arrow.style.transform = `rotate(${heading - (map?.getBearing() ?? 0)}deg)`;
        if (showsAccuracyHalo(item.accuracy)) {
          features.push({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [accuracyRing({ lat, lng }, item.accuracy ?? 0)] },
          });
        }
        if (id === selectedRef.current) selectedAt = [lng, lat];
        if (followRef.current && id === selectedRef.current) followAt = [lng, lat];
      });
      const halo = map?.getSource('accuracy-halo') as import('maplibre-gl').GeoJSONSource | undefined;
      halo?.setData({ type: 'FeatureCollection', features });
      const rider = youRef.current;
      const youHalo = map?.getSource('you-halo') as import('maplibre-gl').GeoJSONSource | undefined;
      const youLine = map?.getSource('you-line') as import('maplibre-gl').GeoJSONSource | undefined;
      if (mode === 'rider' && rider) {
        const radius = Math.max(rider.accuracy || 0, 25);
        youHalo?.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [accuracyRing(rider, radius)] },
          }],
        });
        youLine?.setData(selectedAt ? {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [[rider.lng, rider.lat], selectedAt] },
        } : EMPTY_LINE);
      } else {
        youHalo?.setData({ type: 'FeatureCollection', features: [] });
        youLine?.setData(EMPTY_LINE);
      }
      if (followAt && map) {
        map.jumpTo({
          center: followAt,
          padding: mode === 'rider'
            ? { top: 88, bottom: 150, left: 28, right: 28 }
            : { top: 80, bottom: 40, left: 24, right: 380 },
        });
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [mapReady, mode]);

  useEffect(() => {
    if (follow && mapRef.current && mapRef.current.getZoom() < 14) {
      mapRef.current.easeTo({ zoom: 14, duration: 450 });
    }
  }, [follow]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let cancelled = false;
    void import('maplibre-gl').then((maplibre) => {
      if (cancelled || !mapRef.current) return;
      const shown = data.buses.filter((bus) => (route === 'all' || bus.route === route) && (!search.trim() || `bus ${bus.fleet} ${bus.route}`.toLowerCase().includes(search.trim().toLowerCase())));
      const seen = new Set<string>();
      for (const bus of shown) {
        seen.add(bus.id);
        const geometry = routeGeometry(bus.route)?.points ?? [];
        const display = snapToRoad(bus, geometry, bus.accuracy);
        const next: [number, number] = [display.lng, display.lat];
        const heading = bus.heading ?? display.heading;
        const current = markers.current.get(bus.id);
        if (!current) {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = mode === 'operator' ? 'fleet-pin' : 'bus-pin';
          el.setAttribute('aria-label', `Bus ${bus.fleet}`);
          const arrow = headingArrow();
          if (mode === 'operator') {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.setAttribute('aria-hidden', 'true');
            dot.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 10h16M7 16v2M17 16v2"/></svg>';
            dot.append(arrow);
            const num = document.createElement('span');
            num.className = 'num';
            num.textContent = bus.fleet;
            el.append(dot, num);
          } else {
            el.textContent = bus.fleet;
            el.append(arrow);
          }
          el.addEventListener('click', () => setSelected(bus.id));
          const marker = new maplibre.Marker({ element: el, anchor: 'center' }).setLngLat(next).addTo(map);
          markers.current.set(bus.id, { marker, arrow, from: next, to: next, fromHeading: heading, toHeading: heading, started: performance.now(), accuracy: bus.accuracy, route: geometry, onRoad: display.snapped });
        } else {
          const at = current.marker.getLngLat();
          const t = Math.min(1, (performance.now() - current.started) / POLL_MS);
          const far = haversineMetres({ lat: at.lat, lng: at.lng }, { lat: next[1], lng: next[0] }) > 700;
          current.from = far ? next : [at.lng, at.lat];
          current.to = next;
          current.fromHeading = lerpAngle(current.fromHeading, current.toHeading, t);
          current.toHeading = heading;
          current.started = performance.now();
          current.accuracy = bus.accuracy;
          current.route = geometry;
          current.onRoad = display.snapped;
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
  }, [data.buses, route, search, selected, mode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const chosen = data.buses.find((item) => item.id === selected);
    const line = chosen ? (routeGeometry(chosen.route)?.points.map((point) => [point.lng, point.lat] as [number, number]) ?? []) : [];
    const routeSource = map.getSource('route-line') as import('maplibre-gl').GeoJSONSource | undefined;
    routeSource?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } });
    const stopSource = map.getSource('stop-dots') as import('maplibre-gl').GeoJSONSource | undefined;
    if (mode !== 'operator') {
      stopSource?.setData(EMPTY_POINTS);
      return;
    }
    const groups = data.stops.filter((group) => route === 'all' || group.route === route);
    stopSource?.setData({
      type: 'FeatureCollection',
      features: groups.flatMap((group) => group.stops.map((stop) => ({
        type: 'Feature' as const,
        properties: { name: stop.name },
        geometry: { type: 'Point' as const, coordinates: [stop.lng, stop.lat] as [number, number] },
      }))),
    });
  }, [mapReady, selected, data.buses, data.stops, route, mode]);

  useEffect(() => {
    if (selected && data.buses.some((item) => item.id === selected)) return;
    if (mode === 'rider') {
      if (selected) setSelected(null);
      return;
    }
    const preferred = data.buses.find((item) => item.fleet === '12')
      ?? data.buses.find((item) => item.onShift && !item.stale)
      ?? data.buses[0];
    if (preferred) setSelected(preferred.id);
  }, [data.buses, selected, mode]);

  const places: (GeoPoint & { name: string })[] = [
    ...data.stops.flatMap((group) => group.stops),
    ...(data.landmarks ?? []),
  ];
  const routes = [...new Set(data.buses.map((bus) => bus.route))];
  const bus = data.buses.find((item) => item.id === selected) ?? null;
  const displayBus = bus ? snapToRoad(bus, routeGeometry(bus.route)?.points ?? [], bus.accuracy) : null;
  const query = search.trim().toLowerCase();
  const visible = data.buses.filter((item) => {
    if (route !== 'all' && item.route !== route) return false;
    if (!query) return true;
    return `bus ${item.fleet} ${item.route}`.toLowerCase().includes(query);
  });
  const onShift = data.buses.filter((item) => item.onShift && !item.stale).length;
  const idle = data.buses.filter((item) => !item.onShift && !item.stale).length;
  const stale = data.buses.filter((item) => item.stale).length;

  function placeFor(item: LiveBus): string {
    if (!item.recordedAt) return 'No position yet';
    const line = routeGeometry(item.route)?.points ?? [];
    const display = snapToRoad(item, line, item.accuracy);
    return describePlace(display, item.heading ?? display.heading, line, places, LUSAKA_STREETS);
  }

  function gapFor(item: LiveBus): { metres: number; approach: Approach | null } | null {
    if (!you) return null;
    const samples = distanceHistory.current.get(item.id) ?? [];
    const line = routeGeometry(item.route)?.points ?? [];
    const display = snapToRoad(item, line, item.accuracy);
    const metres = samples[samples.length - 1]?.metres ?? haversineMetres(you, display);
    return { metres, approach: approachFromDistances(samples.map((sample) => sample.metres)) };
  }

  function askLocation() {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState('granted');
        setYou({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy });
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  const chipLabel = (name: string) => {
    const match = data.buses.find((item) => item.route === name);
    const short = usualRoute(name);
    return match ? `Bus ${match.fleet} • ${short}` : short;
  };

  const riderGap = bus ? gapFor(bus) : null;
  const reach = bus && riderGap ? reachMinutes(riderGap.metres, bus.speed, riderGap.approach) : null;

  function metresAway(metres: number) {
    return formatDistance(metres).replace(' from you', ' away');
  }

  function streetLine(item: LiveBus) {
    const place = placeFor(item).split(',')[0]?.replace(/^Near /, '') ?? '';
    const speed = item.speed != null && item.speed >= 1 ? `${Math.round(item.speed * 3.6)} km/h` : 'Stopped';
    const ago = item.recordedAt ? formatUpdated(item.recordedAt, tick).replace(/^Updated /, '') : 'waiting';
    return `${place} · ${speed} · ${ago}`;
  }

  function approachPhrase(approach: Approach | null, compact = false) {
    if (approach === 'towards') return compact ? 'coming your way' : 'Coming towards you';
    if (approach === 'away') return compact ? 'moving away' : 'Moving away';
    if (approach === 'passing') return compact ? 'passing nearby' : 'Passing nearby';
    return '';
  }

  function closeCard() {
    setFollow(false);
    setSelected(null);
  }
  const nearest = [...visible].sort((a, b) => {
    if (!you) return a.fleet.localeCompare(b.fleet, undefined, { numeric: true });
    return (gapFor(a)?.metres ?? Number.POSITIVE_INFINITY) - (gapFor(b)?.metres ?? Number.POSITIVE_INFINITY);
  });
  void historyTick;

  useEffect(() => {
    if (mode !== 'rider' || !mapReady || follow || !you) return;
    const focus = selected ? displayBus : (nearest[0] ? snapToRoad(nearest[0], routeGeometry(nearest[0].route)?.points ?? [], nearest[0].accuracy) : null);
    if (!focus) return;
    const key = selected ?? 'idle';
    if (fittedKey.current === key) return;
    if (haversineMetres(you, focus) > 30_000) return;
    fittedKey.current = key;
    const here = you;
    const there = focus;
    void import('maplibre-gl').then((maplibre) => {
      const map = mapRef.current;
      if (!map || fittedKey.current !== key || map.getContainer().clientHeight < 200) return;
      const bounds = new maplibre.LngLatBounds(
        [Math.min(here.lng, there.lng), Math.min(here.lat, there.lat)],
        [Math.max(here.lng, there.lng), Math.max(here.lat, there.lat)],
      );
      map.fitBounds(bounds, {
        padding: { top: 88, bottom: selected ? 150 : 120, left: 64, right: 64 },
        maxZoom: 16,
        duration: 450,
      });
    });
  }, [mode, mapReady, follow, you, displayBus, selected, nearest]);

  useEffect(() => {
    if (follow) fittedKey.current = null;
  }, [follow]);

  return (
    <div className="relative h-full">
      <div ref={holder} className={mode === 'rider' ? 'h-[calc(100dvh-88px)] w-full' : 'h-[62vh] w-full md:h-dvh'} />
      {mode === 'rider' ? (
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-[0_8px_24px_rgba(11,27,59,0.08)]">
            <span className="sr-only">Find a bus</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A93A6" strokeWidth="2.4" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a bus" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#0B1B3B] outline-none placeholder:text-[#8A93A6]" />
          </label>
          <button type="button" aria-label="Filter routes" aria-expanded={filtersOpen} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#0B1B3B] shadow-[0_8px_24px_rgba(11,27,59,0.08)]" onClick={() => setFiltersOpen((open) => !open)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          </button>
          {filtersOpen ? (
            <div className="absolute right-0 top-14 max-h-64 w-56 overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(11,27,59,0.12)]">
              <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[14px] font-semibold" data-on={route === 'all'} onClick={() => { setRoute('all'); setFiltersOpen(false); }}>All routes</button>
              {routes.map((name) => (
                <button key={name} type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[14px] font-semibold" data-on={route === name} onClick={() => { setRoute(name); setFiltersOpen(false); }}>{usualRoute(name)}</button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="absolute left-3 top-3 z-10 flex gap-3 rounded-2xl bg-white px-3 py-2 text-[12px] font-bold text-[#0B1B3B] shadow-[0_8px_24px_rgba(11,27,59,0.1)]">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#12B76A]" /> On shift <span className="text-[#5C6578]">{onShift}</span></span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#8A93A6]" /> Idle <span className="text-[#5C6578]">{idle}</span></span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E8A317]" /> Stale <span className="text-[#5C6578]">{stale}</span></span>
        </div>
      )}
      {mode === 'operator' ? <div className="absolute left-3 right-3 top-[60px] z-10 flex gap-2 overflow-x-auto md:right-[360px]">
        <button type="button" data-on={route === 'all'} className="chip shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B1B3B] shadow-[0_6px_16px_rgba(11,27,59,0.1)]" onClick={() => setRoute('all')}>All</button>
        {routes.map((name) => (
          <button key={name} type="button" data-on={route === name} className="chip shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B1B3B] shadow-[0_6px_16px_rgba(11,27,59,0.1)]" onClick={() => { setRoute(name); const match = data.buses.find((item) => item.route === name); if (match) setSelected(match.id); }}>{chipLabel(name)}</button>
        ))}
        <button type="button" data-on={follow ? 'true' : 'false'} aria-pressed={follow} disabled={!bus} className="chip shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B1B3B] shadow-[0_6px_16px_rgba(11,27,59,0.1)] disabled:opacity-50" onClick={() => setFollow((value) => !value)}>Follow bus</button>
      </div> : null}
      {mode === 'operator' ? (
        <aside className="relative z-10 bg-[#F4F6FB] p-3 md:absolute md:inset-y-3 md:right-3 md:w-[340px] md:overflow-y-auto md:rounded-[24px] md:bg-white md:p-4 md:shadow-[0_16px_40px_rgba(11,27,59,0.12)]">
          <h2 className="text-[18px] font-extrabold">Nearby buses</h2>
          <p className="text-[12px] text-[#5C6578]">Sorted by last update</p>
          <ul className="mt-3 space-y-2">
            {[...visible].sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0)).map((item) => (
              <li key={item.id}>
                <button type="button" className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${selected === item.id ? 'bg-[#E7EEFF]' : 'bg-white md:bg-[#F4F6FB]'}`} onClick={() => setSelected(item.id)}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1F5BFF] text-[12px] font-extrabold text-white">{item.fleet}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">Bus {item.fleet}</span>
                    <span className={`text-[12px] font-bold ${item.stale ? 'text-[#C47B12]' : item.onShift ? 'text-[#0E7A45]' : 'text-[#5C6578]'}`}>{item.conductor ? `${item.conductor} · ` : ''}{item.stale ? 'Stale' : item.onShift ? 'On shift' : 'Idle'}</span>
                    <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#3E4A63]">{placeFor(item)}</span>
                  </span>
                  <span className="text-right text-[12px] font-semibold text-[#5C6578]">
                    <span className="block text-[14px] font-extrabold text-[#0B1B3B]">{item.speed ? `${Math.round(item.speed * 3.6)} km/h` : '—'}</span>
                    {item.recordedAt ? formatUpdated(item.recordedAt, tick) : 'No update'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      {mode === 'rider' && !bus && nearest[0] ? (
        <div className="absolute inset-x-5 bottom-5 z-20 flex flex-col items-stretch gap-2">
          <button type="button" data-testid="buses-near" className="self-end h-9 rounded-full bg-[#0B1B3B] px-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(11,27,59,0.16)]" onClick={() => setListOpen(true)}>Buses near you</button>
          <button type="button" data-testid="nearest-pill" className="h-12 rounded-full bg-white px-4 text-center text-[14px] font-semibold text-[#0B1B3B] shadow-[0_10px_30px_rgba(11,27,59,0.12)]" onClick={() => { setListOpen(false); setSelected(nearest[0].id); }}>
            {(() => {
              const gap = gapFor(nearest[0]);
              const way = approachPhrase(gap?.approach ?? null, true);
              const distance = gap ? metresAway(gap.metres).replace(' away', '') : '';
              return `Nearest: Bus ${nearest[0].fleet}${distance ? ` · ${distance}` : ''}${way ? ` · ${way}` : ''}`;
            })()}
          </button>
        </div>
      ) : null}
      {mode === 'rider' && bus ? (
        <div
          data-testid="bus-card"
          className="absolute inset-x-4 bottom-4 z-20 rounded-[28px] bg-white px-4 pb-4 pt-2 text-[#0B1B3B] shadow-[0_16px_40px_rgba(11,27,59,0.14)]"
          onPointerDown={(event) => { event.currentTarget.dataset.y = String(event.clientY); }}
          onPointerUp={(event) => {
            const start = Number(event.currentTarget.dataset.y ?? event.clientY);
            if (event.clientY - start > 48) closeCard();
          }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#E4E8F0]" aria-hidden />
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1F5BFF] text-[18px] font-extrabold text-white">{bus.fleet}</span>
            <p className="min-w-0 flex-1 truncate text-[16px] font-semibold text-[#3E4A63]">{usualRoute(bus.route)}</p>
            <button type="button" aria-label="Follow bus" aria-pressed={follow} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${follow ? 'bg-[#1F5BFF] text-white' : 'bg-[#F4F6FB] text-[#0B1B3B]'}`} onClick={() => setFollow((value) => !value)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
            </button>
            <button type="button" aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F4F6FB] text-[#5C6578]" onClick={closeCard}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <p className={`mt-3 truncate text-[16px] font-extrabold leading-none tracking-[-0.03em] ${riderGap?.approach === 'towards' ? 'text-[#128A4E]' : 'text-[#5C6578]'}`}>
            {riderGap ? `${metresAway(riderGap.metres)}${riderGap.approach ? ` · ${approachPhrase(riderGap.approach)}` : ''}${reach != null ? ` · ~${reach} min` : ''}` : locationState === 'denied' ? 'Turn on location to see the distance' : 'Finding your location…'}
          </p>
          <p className="mt-1 truncate text-[13px] font-medium text-[#8A93A6]">{streetLine(bus)}</p>
        </div>
      ) : null}
      {mode === 'rider' && listOpen ? (
        <div className="absolute inset-0 z-30 flex items-end bg-[#0B1B3B]/20" onClick={() => setListOpen(false)}>
          <div data-testid="bus-list" role="dialog" aria-label="Buses near you" className="max-h-[52%] w-full overflow-y-auto rounded-t-[28px] bg-white px-4 pb-6 pt-3 shadow-[0_-12px_40px_rgba(11,27,59,0.12)]" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.currentTarget.dataset.y = String(event.clientY); }} onPointerUp={(event) => { const start = Number(event.currentTarget.dataset.y ?? event.clientY); if (event.clientY - start > 56) setListOpen(false); }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E4E8F0]" aria-hidden />
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold">Buses near you</h2>
              <button type="button" aria-label="Close list" className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F6FB] text-[#5C6578]" onClick={() => setListOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {locationState === 'denied' ? <button type="button" className="mb-3 text-[14px] font-semibold text-[#1F5BFF]" onClick={askLocation}>Turn on location to see the distance</button> : null}
            <ul className="space-y-1">
              {nearest.map((item) => {
                const gap = gapFor(item);
                return (
                  <li key={item.id}>
                    <button type="button" className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left" onClick={() => { setListOpen(false); setFollow(false); setSelected(item.id); }}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1F5BFF] text-[13px] font-extrabold text-white">{item.fleet}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-extrabold">Bus {item.fleet}</span>
                        <span className="block truncate text-[13px] text-[#8A93A6]">{usualRoute(item.route)}</span>
                      </span>
                      <span className={`text-right text-[13px] font-bold ${gap?.approach === 'towards' ? 'text-[#128A4E]' : 'text-[#5C6578]'}`}>
                        {gap ? `${metresAway(gap.metres).replace(' away', '')}${gap.approach ? ` · ${approachPhrase(gap.approach, true)}` : ''}` : 'Location off'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
