import { PassengerSignup } from '@/components/passenger-signup';
import { riderPaymentPath } from '@/lib/codes';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ bus?: string }> }) {
  const { bus } = await searchParams;
  return <PassengerSignup bus={riderPaymentPath(bus) ? bus : undefined} />;
}
