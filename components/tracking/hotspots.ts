import type { LiveBus } from '@/lib/tracking';
import { haversineMetres } from '@/lib/tracking-math';

const MIN_BUSES = 16;
const RADIUS_METRES = 120;

export function busHotspots(buses: LiveBus[]) {
  const candidates = buses.filter((bus) => bus.recordedAt && !bus.stale);
  if (candidates.length < MIN_BUSES) return [];
  const circles = candidates.map((centre) => ({
    centre,
    members: candidates.filter((bus) => haversineMetres(centre, bus) <= RADIUS_METRES),
  })).filter(({ members }) => members.length >= MIN_BUSES);
  circles.sort((a, b) => b.members.length - a.members.length || a.centre.id.localeCompare(b.centre.id));

  const assigned = new Set<string>();
  return circles.flatMap(({ centre, members }) => {
    const available = members.filter((bus) => !assigned.has(bus.id));
    if (available.length < MIN_BUSES || assigned.has(centre.id)) return [];
    available.forEach((bus) => assigned.add(bus.id));
    return [{ id: centre.id, lat: centre.lat, lng: centre.lng, buses: available }];
  });
}

type Station = { id: string; name: string; lat: number; lng: number };

// OpenStreetMap contributors: ways 283146355, 99186160, 99296406 and nodes 13368269265, 5774976057.
// City Market uses the market as a landmark for the adjoining bus station.
const STATIONS: Station[] = [
  { id: 'station-kulima', name: 'Kulima Tower', lat: -15.42353, lng: 28.28032 },
  { id: 'station-city-market', name: 'City Market', lat: -15.42041, lng: 28.27625 },
  { id: 'station-lumumba', name: 'Lumumba', lat: -15.41362, lng: 28.27661 },
  { id: 'station-millennium', name: 'Millennium', lat: -15.41408, lng: 28.27936 },
  { id: 'station-intercity', name: 'Lusaka Intercity', lat: -15.42137, lng: 28.28608 },
];

export function mapHotspots(buses: LiveBus[]): Array<{
  id: string; lat: number; lng: number; buses: LiveBus[]; name?: string;
}> {
  const stations = STATIONS.map((station) => ({ ...station, buses: [] as LiveBus[] }));
  const outside = buses.filter((bus) => {
    if (!bus.recordedAt || bus.stale) return false;
    let closest: (typeof stations)[number] | undefined;
    let distance = RADIUS_METRES;
    for (const station of stations) {
      const metres = haversineMetres(station, bus);
      if (metres > distance) continue;
      closest = station;
      distance = metres;
    }
    if (!closest) return true;
    closest.buses.push(bus);
    return false;
  });
  return [...stations, ...busHotspots(outside)];
}
