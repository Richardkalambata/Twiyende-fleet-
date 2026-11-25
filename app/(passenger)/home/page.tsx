import { redirect } from 'next/navigation';
import { riderPaymentPath } from '@/lib/codes';
import { requireUser } from '@/lib/auth';
import { HomeApp } from '@/components/home-app';
import { getPassengerHome } from '@/lib/service';
import { timeGreeting } from '@/lib/time';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ bus?: string }> }) {
  const legacyFareLink = riderPaymentPath((await searchParams).bus);
  if (legacyFareLink) redirect(legacyFareLink);
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  return <HomeApp name={user.name} initials={user.initials} greeting={timeGreeting()} {...home} />;
}
