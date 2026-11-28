import { SignInPage, type SignInParams } from '@/components/sign-in-page';

export const metadata = { title: 'Conductor sign in' };

export default function LoginPage({ searchParams }: { searchParams: Promise<SignInParams> }) {
  return <SignInPage role="conductor" searchParams={searchParams} />;
}
