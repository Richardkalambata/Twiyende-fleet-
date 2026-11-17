import { requireUser } from '@/lib/auth';
import { HomeApp } from '@/components/home-app';
import { getPassengerHome } from '@/lib/service';

export default async function HomePage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  return (
    <HomeApp
      name={home.user.name}
      initials={home.user.initials}
      balanceNgwee={home.balanceNgwee}
      rides={home.rides}
      buses={home.buses}
    />
  );
}
