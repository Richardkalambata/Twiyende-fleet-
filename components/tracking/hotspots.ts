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
