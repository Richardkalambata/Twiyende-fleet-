import { redirect } from 'next/navigation';
import { destroySession, getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { homeFor, listDemoAccounts } from '@/lib/service';

export const metadata = { title: 'Conductor sign in' };

export default async function ConductorLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === 'conductor') redirect(homeFor(user.role));
  if (user) await destroySession();
  const params = await searchParams;
  const accounts = (await listDemoAccounts()).filter((account) => account.role === 'conductor');
  return <LoginForm accounts={accounts} error={params.error} gate="conductor" />;
}
