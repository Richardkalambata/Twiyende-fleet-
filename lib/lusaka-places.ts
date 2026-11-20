import type { GeoPoint } from './lusaka-routes';
import { bearingDegrees, haversineMetres, projectOnto } from './tracking-math';

/** Named Lusaka road corridors. A coordinate is labelled from the nearest segment, with no geocoding service. */
export const LUSAKA_STREETS: { name: string; points: GeoPoint[] }[] = [
  {
    name: 'Cairo Road',
    points: [
      { lat: -15.4265, lng: 28.2806 },
      { lat: -15.4220, lng: 28.2816 },
      { lat: -15.4186, lng: 28.2819 },
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4122, lng: 28.2834 },
      { lat: -15.4088, lng: 28.2844 },
    ],
  },
  {
    name: 'Great North Road',
    points: [
      { lat: -15.4088, lng: 28.2844 },
      { lat: -15.4068, lng: 28.2848 },
      { lat: -15.4011, lng: 28.2826 },
      { lat: -15.3954, lng: 28.2788 },
      { lat: -15.3896, lng: 28.2742 },
      { lat: -15.3842, lng: 28.2691 },
      { lat: -15.3788, lng: 28.2634 },
    ],
  },
  {
    name: 'Great East Road',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4108, lng: 28.2964 },
      { lat: -15.4046, lng: 28.3128 },
      { lat: -15.3984, lng: 28.3286 },
      { lat: -15.3922, lng: 28.3424 },
      { lat: -15.3864, lng: 28.3548 },
    ],
  },
  {
    name: 'Alick Nkhata Road',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4142, lng: 28.2904 },
      { lat: -15.4114, lng: 28.2996 },
      { lat: -15.4086, lng: 28.3082 },
      { lat: -15.4062, lng: 28.3158 },
      { lat: -15.4044, lng: 28.3214 },
    ],
  },
  {
    name: 'Burma Road',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4194, lng: 28.2868 },
      { lat: -15.4228, lng: 28.2916 },
      { lat: -15.4266, lng: 28.2954 },
      { lat: -15.4302, lng: 28.2972 },
      { lat: -15.4338, lng: 28.2986 },
    ],
  },
  {
    name: 'Kafue Road',
    points: [
      { lat: -15.3788, lng: 28.2634 },
      { lat: -15.3885, lng: 28.2668 },
      { lat: -15.3992, lng: 28.2704 },
      { lat: -15.4104, lng: 28.2741 },
      { lat: -15.4226, lng: 28.2766 },
      { lat: -15.4348, lng: 28.2752 },
      { lat: -15.4462, lng: 28.2734 },
      { lat: -15.4576, lng: 28.2718 },
    ],
  },
  {
    name: 'Chilimbulu Road',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4218, lng: 28.2884 },
      { lat: -15.4274, lng: 28.2962 },
      { lat: -15.4336, lng: 28.3048 },
      { lat: -15.4402, lng: 28.3126 },
      { lat: -15.4468, lng: 28.3184 },
    ],
  },
];

/** Landmarks stored in the stops table under the Landmarks route. */
export const LUSAKA_LANDMARKS: (GeoPoint & { name: string })[] = [
  { name: 'Kulima Tower', lat: -15.4220, lng: 28.2816 },
  { name: 'Findeco House', lat: -15.4186, lng: 28.2819 },
];

const STREET_MATCH_M = 700;
const APPROACH_MIN_M = 70;
const APPROACH_MAX_M = 900;
const NEAR_M = 1400;

function angleDelta(a: number, b: number): number {
  return Math.abs(((b - a + 540) % 360) - 180);
}

export function describePlace(
  point: GeoPoint,
  heading: number | null,
  route: GeoPoint[],
  places: (GeoPoint & { name: string })[],
  streets: { name: string; points: GeoPoint[] }[] = LUSAKA_STREETS,
): string {
  let street: { name: string; distance: number } | null = null;
  for (const item of streets) {
    const hit = projectOnto(item.points, point);
    if (!street || hit.distance < street.distance) street = { name: item.name, distance: hit.distance };
  }
  const streetName = street && street.distance <= STREET_MATCH_M ? street.name : null;
  const course = heading ?? (route.length >= 2 ? projectOnto(route, point).heading : null);
  let ahead: { name: string; distance: number } | null = null;
  let nearest: { name: string; distance: number } | null = null;
  for (const place of places) {
    const distance = haversineMetres(point, place);
    if (!nearest || distance < nearest.distance) nearest = { name: place.name, distance };
    if (course == null || distance < APPROACH_MIN_M || distance > APPROACH_MAX_M) continue;
    if (angleDelta(course, bearingDegrees(point, place)) > 55) continue;
    if (!ahead || distance < ahead.distance) ahead = { name: place.name, distance };
  }
  const named = ahead ?? (nearest && nearest.distance <= NEAR_M ? nearest : null);
  if (streetName && named) return `${streetName}, near ${named.name}`;
  if (nearest && nearest.distance <= 700) return `Near ${nearest.name}`;
  if (streetName) return streetName;
  return 'Lusaka';
}
