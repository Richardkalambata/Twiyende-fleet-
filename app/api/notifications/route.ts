import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { syncExpiredFleetShifts } from '@/lib/tracking';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getCurrentUser();
  if (!user) return Response.json({ unread: 0 }, { status: 401, headers });
  if (user.role === 'operator') await syncExpiredFleetShifts(user.id);
  const row = await (await getDb()).get<{ unread: number }>(
    'SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL', user.id,
  );
  return Response.json({ unread: row?.unread ?? 0 }, { headers });
}
