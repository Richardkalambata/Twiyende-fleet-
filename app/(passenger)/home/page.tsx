import { riderPaymentPath } from '@/lib/codes';
import { requireUser } from '@/lib/auth';
import { HomeApp } from '@/components/home-app';
import { getPassengerHome, listPassengerRides } from '@/lib/service';
import { startOfLusakaMonth, timeGreeting } from '@/lib/time';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ bus?: string }> }) {
  const params = await searchParams;
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  const history = await listPassengerRides(user.id);
  const monthStart = startOfLusakaMonth();
  const monthCount = history.filter((ride) => ride.createdAt >= monthStart && ride.status !== 'void').length;
  return (
    <HomeApp
      name={home.user.name}
      initials={home.user.initials}
      greeting={timeGreeting()}
      balanceNgwee={home.balanceNgwee}
      rides={history.slice(0, 3)}
      monthCount={monthCount}
      buses={home.buses}
      initialFleet={riderPaymentPath(params.bus) ? params.bus : ''}
    />
  );
}
