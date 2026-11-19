'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LiveBus } from '@/lib/tracking';
import { LUSAKA_STREETS, describePlace } from '@/lib/lusaka-places';
import { routeGeometry, type GeoPoint } from '@/lib/lusaka-routes';
import { DEMO_RIDER, LUSAKA_BOUNDS, OPEN_FRAME_M, accuracyRing, alongError, approachFromDistances, demoSpeed, formatDistance, formatUpdated, glideDistance, glideSpeed, haversineMetres, lerpAngle, pointAtDistance, projectOnto, reachMinutes, riderCounts, routeLength, showsAccuracyHalo, snapToRoad, trailSamples, trimTrail, type Approach } from '@/lib/tracking-math';
import { createBusPin } from './bus-pin';

type Stop = { id: string; name: string; lat: number; lng: number; seq: number };
type Payload = { buses: LiveBus[]; stops: { route: string; stops: Stop[] }[]; landmarks?: Stop[]; demo?: boolean; now: number };
type YouFix = { lat: number; lng: number; accuracy: number; demo?: boolean };
type DistanceSample = { at: number; metres: number };
const POLL_MS = 1_000;
const TRAIL_MS = 45_000;
const TRAIL_M = 380;
const DEMO_VIEW: YouFix = { ...DEMO_RIDER, demo: true };

type Glide = {
  along: number;
  at: number;
  speed: number;
  heading: number;
  route: GeoPoint[];
  length: number;
  trail: { at: number; lng: number; lat: number }[];
};

type Pin = {
  marker: import('maplibre-gl').Marker;
  arrow: HTMLElement;
  glide: Glide | null;
  accuracy: number | null;
};

const EMPTY_LINE = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [] as [number, number][] } };
const EMPTY_POINTS = { type: 'FeatureCollection' as const, features: [] as { type: 'Feature'; properties: { name: string }; geometry: { type: 'Point'; coordinates: [number, number] } }[] };

function arrowImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#1F5BFF';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(18, 4);
  ctx.lineTo(31, 31);
  ctx.lineTo(18, 24);
  ctx.lineTo(5, 31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return ctx.getImageData(0, 0, 36, 36);
}

function usualRoute(route: string | null) {
  return route ? route.replaceAll(' to ', ' ↔ ') : '';
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
  const [showRoute, setShowRoute] = useState(false);
  const movingBuses = data.buses.filter((item) => item.recordedAt);
  const nearestBus = movingBuses.reduce<LiveBus | null>((best, bus) => {
    if (!best) return bus;
    const origin = you ?? DEMO_RIDER;
    return haversineMetres(origin, bus) < haversineMetres(origin, best) ? bus : best;
  }, null);
  const viewer: YouFix | null = data.demo
    ? DEMO_VIEW
    : (you && nearestBus && riderCounts(you, nearestBus) ? you : null);
  followRef.current = follow;
  selectedRef.current = selected;
  youRef.current = viewer;

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
        center: [28.29, -15.414],
        zoom: 15.5,
        maxBounds: mode === 'rider' ? [[LUSAKA_BOUNDS.west, LUSAKA_BOUNDS.south], [LUSAKA_BOUNDS.east, LUSAKA_BOUNDS.north]] : undefined,
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
        const arrow = arrowImage();
        if (arrow && !map.hasImage('ahead-arrow')) map.addImage('ahead-arrow', arrow, { pixelRatio: 1 });
        map.addSource('bus-trails', { type: 'geojson', lineMetrics: true, data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'bus-trails',
          type: 'line',
          source: 'bus-trails',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-width': 4,
            'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, 'rgba(31,91,255,0)', 0.4, 'rgba(31,91,255,0.04)', 0.78, 'rgba(31,91,255,0.2)', 1, 'rgba(31,91,255,0.55)'],
          },
        });
        map.addSource('ahead-line', { type: 'geojson', data: EMPTY_LINE });
        map.addLayer({
          id: 'ahead-casing',
          type: 'line',
          source: 'ahead-line',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.85 },
        });
        map.addLayer({
          id: 'ahead-line',
          type: 'line',
          source: 'ahead-line',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#C5D4FB', 'line-width': 5, 'line-opacity': 0.95 },
        });
        map.addSource('ahead-tip', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'ahead-tip',
          type: 'symbol',
          source: 'ahead-tip',
          layout: {
            'icon-image': 'ahead-arrow',
            'icon-size': 0.85,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });
        map.addSource('route-line', { type: 'geojson', data: EMPTY_LINE });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: mode === 'rider'
            ? { 'line-color': '#1F5BFF', 'line-width': 6, 'line-opacity': 0.55 }
            : { 'line-color': '#9AA8C0', 'line-width': 2, 'line-opacity': 0.35 },
        });
        map.addSource('you-line', { type: 'geojson', data: EMPTY_LINE });
        map.addLayer({
          id: 'you-line',
          type: 'line',
          source: 'you-line',
          paint: { 'line-color': '#8FB0FF', 'line-width': 1.5, 'line-opacity': 0.9, 'line-dasharray': [1.2, 1.8] },
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
        map.addLayer({ id: 'you-halo', type: 'fill', source: 'you-halo', paint: { 'fill-color': '#1A73E8', 'fill-opacity': 0.16 } });
        map.addLayer({ id: 'you-halo-line', type: 'line', source: 'you-halo', paint: { 'line-color': '#1A73E8', 'line-width': 2, 'line-opacity': 0.45 } });
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
    if (!mapReady || mode !== 'rider' || !viewer) return;
    const map = mapRef.current;
    if (!map || youMarker.current) return;
    let dead = false;
    void import('maplibre-gl').then((maplibre) => {
      if (dead || !mapRef.current || !youRef.current || youMarker.current) return;
      const el = document.createElement('div');
      el.className = 'you-pin';
      el.innerHTML = `<span class="you-dot"></span><span class="you-label">${youRef.current.demo ? 'You (demo)' : 'You'}</span>`;
      el.setAttribute('aria-label', youRef.current.demo ? 'You (demo)' : 'You');
      youMarker.current = new maplibre.Marker({ element: el, anchor: 'center' })
        .setLngLat([youRef.current.lng, youRef.current.lat])
        .addTo(mapRef.current);
    });
    return () => { dead = true; };
  }, [mapReady, mode, viewer]);

  useEffect(() => {
    if (!viewer) {
      youMarker.current?.remove();
      youMarker.current = null;
      return;
    }
    const label = viewer.demo ? 'You (demo)' : 'You';
    const marker = youMarker.current;
    if (marker) {
      marker.setLngLat([viewer.lng, viewer.lat]);
      const text = marker.getElement().querySelector('.you-label');
      if (text) text.textContent = label;
      marker.getElement().setAttribute('aria-label', label);
      return;
    }
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;
    let changed = false;
    for (const bus of data.buses) {
      const line = routeGeometry(bus.route)?.points ?? [];
      const display = snapToRoad(bus, line, bus.accuracy);
      const metres = haversineMetres(viewer, display);
      const previous = distanceHistory.current.get(bus.id) ?? [];
      if (previous[previous.length - 1]?.at === bus.recordedAt) continue;
      distanceHistory.current.set(bus.id, [...previous, { at: bus.recordedAt, metres }].slice(-4));
      changed = true;
    }
    if (changed) setHistoryTick((value) => value + 1);
  }, [data.buses, viewer]);

  useEffect(() => {
    if (!mapReady) return;
    let frame = 0;
    const paint = (now: number) => {
      const map = mapRef.current;
      const features: { type: 'Feature'; properties: Record<string, never>; geometry: { type: 'Polygon'; coordinates: [number, number][][] } }[] = [];
      let followAt: [number, number] | null = null;
      let selectedAt: [number, number] | null = null;
      markers.current.forEach((item, id) => {
        const glide = item.glide;
        if (!glide || glide.route.length < 2) return;
        const dt = Math.min(0.1, Math.max(0, (now - glide.at) / 1000));
        glide.at = now;
        glide.along = glideDistance(glide.along, glide.speed, dt);
        const spot = pointAtDistance(glide.route, glide.along);
        const ease = 1 - Math.exp(-dt / 0.18);
        glide.heading = lerpAngle(glide.heading, spot.heading, ease);
        item.marker.setLngLat([spot.lng, spot.lat]);
        item.arrow.style.transform = `rotate(${glide.heading - (map?.getBearing() ?? 0)}deg)`;
        if (mode === 'rider' && glide.speed >= 1) {
          const last = glide.trail[glide.trail.length - 1];
          const jumped = last != null && haversineMetres(last, spot) > 700;
          if (jumped) glide.trail = [];
          if (!last || jumped || now - last.at > 450) glide.trail.push({ at: now, lng: spot.lng, lat: spot.lat });
          const keepAfter = now - TRAIL_MS;
          while (glide.trail.length > 2 && glide.trail[0].at < keepAfter) glide.trail.shift();
        }
        const lng = spot.lng;
        const lat = spot.lat;
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
      const trails = map?.getSource('bus-trails') as import('maplibre-gl').GeoJSONSource | undefined;
      trails?.setData({
        type: 'FeatureCollection',
        features: mode === 'rider' ? [...markers.current.values()].flatMap((item) => {
          const points = trimTrail(item.glide?.trail ?? [], TRAIL_M);
          if (points.length < 2) return [];
          return [{
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: points.map((point) => [point.lng, point.lat] as [number, number]) },
          }];
        }) : [],
      });
      const aheadSource = map?.getSource('ahead-line') as import('maplibre-gl').GeoJSONSource | undefined;
      const aheadTip = map?.getSource('ahead-tip') as import('maplibre-gl').GeoJSONSource | undefined;
      aheadSource?.setData(EMPTY_LINE);
      aheadTip?.setData({ type: 'FeatureCollection', features: [] });
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
        const length = routeLength(geometry);
        const syncGlide = (pin: Pin) => {
          if (geometry.length < 2 || length <= 0) {
            pin.glide = null;
            pin.marker.setLngLat(next);
            return;
          }
          const serverAlong = projectOnto(geometry, display).along;
          const base = demoSpeed(length);
          if (!pin.glide) {
            const trail = mode === 'rider' ? trailSamples(geometry, serverAlong, Math.min(base * 45, TRAIL_M), performance.now(), TRAIL_MS) : [];
            pin.glide = { along: serverAlong, at: performance.now(), speed: base, heading, route: geometry, length, trail };
            pin.marker.setLngLat(next);
            return;
          }
          pin.glide.route = geometry;
          pin.glide.length = length;
          pin.glide.speed = glideSpeed(base, alongError(pin.glide.along, serverAlong, length));
        };
        if (!current) {
          const { element: el, arrow } = createBusPin(bus.fleet);
          el.addEventListener('click', () => setSelected(bus.id));
          const marker = new maplibre.Marker({ element: el, anchor: 'bottom' }).setLngLat(next).addTo(map);
          const pin: Pin = { marker, arrow, glide: null, accuracy: bus.accuracy };
          syncGlide(pin);
          markers.current.set(bus.id, pin);
        } else {
          current.accuracy = bus.accuracy;
          syncGlide(current);
        }
        const element = markers.current.get(bus.id)?.marker.getElement();
        if (element) {
          element.dataset.stale = bus.stale ? 'true' : 'false';
          element.dataset.idle = bus.onShift ? 'false' : 'true';
          element.dataset.on = selected === bus.id ? 'true' : 'false';
          element.dataset.dim = selected && selected !== bus.id ? 'true' : 'false';
          element.style.zIndex = selected === bus.id ? '3' : '1';
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
    const drawRoute = chosen?.route && (mode === 'operator' || showRoute);
    const line = drawRoute ? (routeGeometry(chosen.route)?.points.map((point) => [point.lng, point.lat] as [number, number]) ?? []) : [];
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
  }, [mapReady, selected, data.buses, data.stops, route, mode, showRoute]);

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
  const routes = [...new Set(data.buses.flatMap((bus) => (bus.route ? [bus.route] : [])))];
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
    if (!viewer) return null;
    const samples = distanceHistory.current.get(item.id) ?? [];
    const line = routeGeometry(item.route)?.points ?? [];
    const display = snapToRoad(item, line, item.accuracy);
    const metres = samples[samples.length - 1]?.metres ?? haversineMetres(viewer, display);
    return { metres, approach: approachFromDistances(samples.map((sample) => sample.metres)) };
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
    return `${place} · ${speed} · updated ${ago}`;
  }

  function approachPhrase(approach: Approach | null) {
    if (approach === 'towards') return 'Coming towards you';
    if (approach === 'away') return 'Moving away';
    if (approach === 'passing') return 'Passing nearby';
    return '';
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

  function closeCard() {
    setFollow(false);
    setSelected(null);
  }
  void historyTick;

  useEffect(() => {
    if (mode !== 'rider' || !mapReady || follow) return;
    const moving = data.buses.filter((item) => item.recordedAt);
    if (moving.length === 0) return;
    const town = { lat: -15.414, lng: 28.29 };
    const closest = [...moving].sort((a, b) => haversineMetres(viewer ?? town, a) - haversineMetres(viewer ?? town, b))[0];
    const youNear = viewer && closest && haversineMetres(viewer, closest) <= OPEN_FRAME_M ? viewer : null;
    const origin = youNear ?? closest ?? town;
    const ranked = [...moving].sort((a, b) => haversineMetres(origin, a) - haversineMetres(origin, b));
    const picked: LiveBus[] = [];
    for (const item of ranked) {
      if (picked.length >= 4) break;
      if (picked.length >= 1 && haversineMetres(origin, item) > OPEN_FRAME_M) break;
      picked.push(item);
    }
    const key = selected ? `${selected}${showRoute ? '-route' : ''}` : (youNear ? 'open-you' : 'open-buses');
    if (fittedKey.current === key) return;
    if (selected && !displayBus) return;
    fittedKey.current = key;
    const spots = picked.map((item) => snapToRoad(item, routeGeometry(item.route)?.points ?? [], item.accuracy));
    void import('maplibre-gl').then((maplibre) => {
      const map = mapRef.current;
      if (!map || fittedKey.current !== key || map.getContainer().clientHeight < 200) return;
      const besideBus = viewer && displayBus && haversineMetres(viewer, displayBus) <= OPEN_FRAME_M ? viewer : null;
      const seed = (selected ? (besideBus ?? displayBus) : (youNear ?? spots[0])) ?? spots[0];
      const focus = selected && displayBus ? [displayBus] : spots;
      let shown = focus;
      const padding = { top: 96, bottom: selected ? 180 : 80, left: selected ? 56 : 48, right: selected ? 72 : 88 };
      const boundsFor = (points: { lng: number; lat: number }[]) => {
        const next = new maplibre.LngLatBounds([seed.lng, seed.lat], [seed.lng, seed.lat]);
        if (!selected && youNear) next.extend([youNear.lng, youNear.lat]);
        if (selected && besideBus) next.extend([besideBus.lng, besideBus.lat]);
        for (const spot of points) next.extend([spot.lng, spot.lat]);
        return next;
      };
      let bounds = boundsFor(shown);
      if (!selected) {
        while (shown.length > 2) {
          const camera = map.cameraForBounds(bounds, { padding, maxZoom: 16 });
          const zoom = camera?.zoom ?? 0;
          if (zoom >= 15 || shown.length <= 2) break;
          shown = shown.slice(0, -1);
          bounds = boundsFor(shown);
        }
      }
      if (selected && showRoute && bus?.route) {
        for (const point of routeGeometry(bus.route)?.points ?? []) bounds.extend([point.lng, point.lat]);
      }
      map.fitBounds(bounds, {
        padding,
        maxZoom: 16,
        duration: selected ? 450 : 0,
      });
    });
  }, [mode, mapReady, follow, viewer, displayBus, selected, bus, data.buses, showRoute]);

  useEffect(() => {
    if (follow) fittedKey.current = null;
  }, [follow]);

  useEffect(() => {
    setShowRoute(false);
  }, [selected]);

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
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1F5BFF] text-[18px] font-extrabold text-white">{bus.fleet}</span>
            <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#3E4A63]">{usualRoute(bus.route) || `Bus ${bus.fleet}`}</p>
            <button type="button" aria-label="Follow bus" aria-pressed={follow} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${follow ? 'bg-[#1F5BFF] text-white' : 'bg-[#F4F6FB] text-[#0B1B3B]'}`} onClick={() => setFollow((value) => !value)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
            </button>
            <button type="button" aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8A93A6]" onClick={closeCard}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <p data-testid="heading-line" className="mt-3 text-[16px] font-extrabold leading-snug tracking-[-0.03em]">
            {riderGap ? (
              <>
                <span className="text-[#0B1B3B]">{metresAway(riderGap.metres)}</span>
                {riderGap.approach ? <span className={riderGap.approach === 'towards' ? 'text-[#128A4E]' : 'text-[#5C6578]'}>{` · ${approachPhrase(riderGap.approach)}`}</span> : null}
                {reach != null ? <span className="text-[#8A93A6]">{` · ~${reach} min`}</span> : null}
              </>
            ) : locationState === 'denied' && !data.demo ? (
              <button type="button" className="font-semibold text-[#1F5BFF]" onClick={askLocation}>Turn on location to see the distance</button>
            ) : data.demo ? 'Finding your location…' : 'Outside the Lusaka service area'}
          </p>
          <p className="mt-1 truncate text-[13px] font-medium text-[#8A93A6]">{streetLine(bus)}</p>
          {bus.route && routeGeometry(bus.route) ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#5C6578]">Show route</span>
              <button type="button" role="switch" aria-checked={showRoute} aria-label="Show route" data-testid="show-route" className={`relative h-7 w-12 rounded-full transition-colors ${showRoute ? 'bg-[#1F5BFF]' : 'bg-[#E4E8F0]'}`} onClick={() => setShowRoute((value) => !value)}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow ${showRoute ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
