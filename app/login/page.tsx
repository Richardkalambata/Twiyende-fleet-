import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { listDemoAccounts, homeFor } from '@/lib/service';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const params = await searchParams;
  const accounts = (await listDemoAccounts()).filter((account) => account.role === 'passenger');
  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10">
      <LoginForm accounts={accounts} error={params.error} />
    </main>
  );
}
