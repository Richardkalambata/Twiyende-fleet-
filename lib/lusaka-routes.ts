export type GeoPoint = { lat: number; lng: number };

export type LusakaRoute = {
  route: string;
  points: GeoPoint[];
  stops: { name: string; lat: number; lng: number }[];
};

/** Road-corridor coordinates through Lusaka, west to east and north to south. */
export const LUSAKA_ROUTES: LusakaRoute[] = [
  {
    route: 'Town to Matero',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4122, lng: 28.2834 },
      { lat: -15.4068, lng: 28.2848 },
      { lat: -15.4011, lng: 28.2826 },
      { lat: -15.3954, lng: 28.2788 },
      { lat: -15.3896, lng: 28.2742 },
      { lat: -15.3842, lng: 28.2691 },
      { lat: -15.3788, lng: 28.2634 },
    ],
    stops: [
      { name: 'Town Centre', lat: -15.4167, lng: 28.2817 },
      { name: 'Northmead', lat: -15.4011, lng: 28.2826 },
      { name: 'Great North Road', lat: -15.3896, lng: 28.2742 },
      { name: 'Matero Market', lat: -15.3788, lng: 28.2634 },
    ],
  },
  {
    route: 'Matero to Chawama',
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
    stops: [
      { name: 'Matero', lat: -15.3788, lng: 28.2634 },
      { name: 'Industrial Area', lat: -15.4104, lng: 28.2741 },
      { name: 'Kamwala', lat: -15.4348, lng: 28.2752 },
      { name: 'Chawama', lat: -15.4576, lng: 28.2718 },
    ],
  },
  {
    route: 'Town to Kabwata',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4194, lng: 28.2868 },
      { lat: -15.4228, lng: 28.2916 },
      { lat: -15.4266, lng: 28.2954 },
      { lat: -15.4302, lng: 28.2972 },
      { lat: -15.4338, lng: 28.2986 },
    ],
    stops: [
      { name: 'Town Centre', lat: -15.4167, lng: 28.2817 },
      { name: 'Ridgeway', lat: -15.4228, lng: 28.2916 },
      { name: 'Kabwata', lat: -15.4338, lng: 28.2986 },
    ],
  },
  {
    route: 'Town to Chilenje',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4218, lng: 28.2884 },
      { lat: -15.4274, lng: 28.2962 },
      { lat: -15.4336, lng: 28.3048 },
      { lat: -15.4402, lng: 28.3126 },
      { lat: -15.4468, lng: 28.3184 },
    ],
    stops: [
      { name: 'Town Centre', lat: -15.4167, lng: 28.2817 },
      { name: 'Kamwala', lat: -15.4274, lng: 28.2962 },
      { name: 'Chilenje', lat: -15.4468, lng: 28.3184 },
    ],
  },
  {
    route: 'Town to Kalingalinga',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4142, lng: 28.2904 },
      { lat: -15.4114, lng: 28.2996 },
      { lat: -15.4086, lng: 28.3082 },
      { lat: -15.4062, lng: 28.3158 },
      { lat: -15.4044, lng: 28.3214 },
    ],
    stops: [
      { name: 'Town Centre', lat: -15.4167, lng: 28.2817 },
      { name: 'Longacres', lat: -15.4114, lng: 28.2996 },
      { name: 'Kalingalinga', lat: -15.4044, lng: 28.3214 },
    ],
  },
  {
    route: 'Town to Chelston',
    points: [
      { lat: -15.4167, lng: 28.2817 },
      { lat: -15.4108, lng: 28.2964 },
      { lat: -15.4046, lng: 28.3128 },
      { lat: -15.3984, lng: 28.3286 },
      { lat: -15.3922, lng: 28.3424 },
      { lat: -15.3864, lng: 28.3548 },
    ],
    stops: [
      { name: 'Town Centre', lat: -15.4167, lng: 28.2817 },
      { name: 'Kalingalinga', lat: -15.4046, lng: 28.3128 },
      { name: 'Chelston', lat: -15.3864, lng: 28.3548 },
    ],
  },
];

export function routeGeometry(route: string | null | undefined): LusakaRoute | undefined {
  if (!route) return undefined;
  return LUSAKA_ROUTES.find((item) => item.route === route);
}
