import { riderPaymentPath } from '@/lib/codes';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { listDemoAccounts, homeFor } from '@/lib/service';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; bus?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  if (user?.role === 'passenger') redirect(riderPaymentPath(params.bus) ?? homeFor(user.role));
  const accounts = (await listDemoAccounts()).filter((account) => account.role === 'passenger');
  return <LoginForm accounts={accounts} error={params.error} bus={params.bus} />;
}
