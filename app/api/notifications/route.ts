import { getCurrentUser, isRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { syncExpiredFleetShifts } from '@/lib/tracking';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const role = new URL(request.url).searchParams.get('role') ?? 'passenger';
  if (!isRole(role)) return Response.json({ unread: 0 }, { status: 400, headers });
  const user = await getCurrentUser(role);
  if (!user) return Response.json({ unread: 0 }, { status: 401, headers });
  if (user.role === 'operator') await syncExpiredFleetShifts(user.id);
  const row = await (await getDb()).get<{ unread: number }>(
    'SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL', user.id,
  );
  return Response.json({ unread: row?.unread ?? 0 }, { headers });
}
