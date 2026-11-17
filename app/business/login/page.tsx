import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { homeFor, listDemoAccounts } from '@/lib/service';

export const metadata = { title: 'Business sign in' };

export default async function BusinessLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const params = await searchParams;
  const accounts = (await listDemoAccounts()).filter((account) => account.role !== 'passenger');
  return <LoginForm accounts={accounts} error={params.error} gate="business" />;
}
