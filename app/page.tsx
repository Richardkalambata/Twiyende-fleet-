import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { homeFor } from '@/lib/service';

export default async function IndexPage() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : '/login');
}
