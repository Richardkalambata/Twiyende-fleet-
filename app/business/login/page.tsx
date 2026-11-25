import { requiresOperatorSms } from '@/lib/operator-sms-policy';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { homeFor, listDemoAccounts } from '@/lib/service';

export const metadata = { title: 'Operator sign in' };

export default async function BusinessLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser('operator');
  if (user?.role === 'operator') redirect(homeFor(user.role));
  const params = await searchParams;
  const accounts = (await listDemoAccounts()).filter((account) => account.role === 'operator');
  return <LoginForm accounts={accounts} error={params.error} gate="operator" operatorSmsRequired={requiresOperatorSms()} />;
}
