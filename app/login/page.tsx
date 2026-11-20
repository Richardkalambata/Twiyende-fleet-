import { redirect } from 'next/navigation';
import { destroySession, getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { listDemoAccounts, homeFor } from '@/lib/service';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === 'passenger') redirect(homeFor(user.role));
  if (user) await destroySession();
  const params = await searchParams;
  const accounts = (await listDemoAccounts()).filter((account) => account.role === 'passenger');
  return <LoginForm accounts={accounts} error={params.error} />;
}
