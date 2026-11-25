import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { riderPaymentPath } from '@/lib/codes';
import { getBalance, getFareBusOption } from '@/lib/service';
import { PayForm } from '@/components/pay-form';

export const metadata = { title: 'Pay your fare' };

export default async function FarePage({ searchParams }: { searchParams: Promise<{ bus?: string }> }) {
  const { bus } = await searchParams;
  const initialFleet = riderPaymentPath(bus) ? bus ?? '' : '';
  const rider = await getCurrentUser('passenger');
  if (rider?.role !== 'passenger') redirect(initialFleet ? '/login?bus=' + initialFleet : '/login');
  const [balanceNgwee, initialBus] = await Promise.all([
    getBalance(rider.id), initialFleet ? getFareBusOption(initialFleet) : null,
  ]);
  return (
    <PayForm key={initialFleet} initialFleet={initialFleet} initialBus={initialBus}
      balanceNgwee={balanceNgwee} riderId={rider.id} publicOrigin={process.env.TWENDE_PUBLIC_ORIGIN} />
  );
}
