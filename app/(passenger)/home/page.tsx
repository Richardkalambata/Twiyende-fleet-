import { requireUser } from '@/lib/auth';
import { HomeApp, type UsualRoute } from '@/components/home-app';
import { getPassengerHome, listPassengerRides } from '@/lib/service';
import { startOfLusakaMonth, timeGreeting } from '@/lib/time';

export default async function HomePage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  const history = await listPassengerRides(user.id);
  const monthStart = startOfLusakaMonth();
  const monthCount = history.filter((ride) => ride.createdAt >= monthStart && ride.status !== 'void').length;
  const counts = new Map<string, UsualRoute & { count: number }>();
  for (const ride of history) {
    if (ride.status === 'void') continue;
    const current = counts.get(ride.fleetNumber) ?? { fleetNumber: ride.fleetNumber, route: ride.route, count: 0 };
    current.count += 1;
    counts.set(ride.fleetNumber, current);
  }
  const usual = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  return (
    <HomeApp
      name={home.user.name}
      initials={home.user.initials}
      greeting={timeGreeting()}
      balanceNgwee={home.balanceNgwee}
      rides={history.slice(0, 3)}
      monthCount={monthCount}
      usual={usual}
      buses={home.buses}
    />
  );
}
