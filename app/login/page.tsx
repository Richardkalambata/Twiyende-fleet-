import { SignInPage, type SignInParams } from '@/components/sign-in-page';

export default function LoginPage({ searchParams }: { searchParams: Promise<SignInParams> }) {
  return <SignInPage role="passenger" searchParams={searchParams} />;
}
