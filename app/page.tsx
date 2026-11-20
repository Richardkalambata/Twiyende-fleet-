import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Onboarding } from '@/components/onboarding';
import { homeFor } from '@/lib/service';

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return <Onboarding />;
}
