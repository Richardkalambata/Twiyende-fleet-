import { NotificationList } from '@/components/notification-list';
import { requireUser } from '@/lib/auth';
import { listNotifications } from '@/lib/service';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser(['passenger']);
  return (
    <div className="safe-top space-y-4 px-5 pb-8">
      <h1 className="text-[28px] font-extrabold">Notifications</h1>
      <NotificationList notices={await listNotifications(user.id)} />
    </div>
  );
}
