import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { riderPaymentPath } from '@/lib/codes';
import { requiresOperatorSms } from '@/lib/operator-sms-policy';
import { pinResetAvailable } from '@/lib/pin-reset';
import { homeFor, listDemoAccounts } from '@/lib/service';
import type { Role } from '@/lib/types';
import { LoginForm } from './login-form';

export type SignInParams = { error?: string; bus?: string; created?: string; forgot?: string; pinReset?: string };

export async function SignInPage({ role, searchParams }: { role: Role; searchParams: Promise<SignInParams> }) {
  const [user, params, requestHeaders] = await Promise.all([getCurrentUser(role), searchParams, headers()]);
  const bus = role === 'passenger' && riderPaymentPath(params.bus) ? params.bus : undefined;
  if (user) redirect(riderPaymentPath(bus) ?? homeFor(role));
  const recovery = params.forgot === '1';
  const accounts = recovery ? [] : (await listDemoAccounts()).filter((account) => account.role === role);
  return <LoginForm gate={role} bus={bus} accounts={accounts} error={params.error}
    recovery={recovery} recoveryAvailable={pinResetAvailable()}
    notice={params.pinReset === '1' ? 'PIN reset. Sign in with your new PIN.' : params.created === '1' ? 'Account created. Sign in to continue.' : undefined}
    compact={/\bTwendeAndroid\//.test(requestHeaders.get('user-agent') ?? '')}
    operatorSmsRequired={role === 'operator' && requiresOperatorSms()} />;
}
