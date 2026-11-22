import { getDb } from './db';
import { nid } from './text';

export async function notifyUser(userId: string, title: string, body: string, href: string) {
  await (await getDb()).run(
    'INSERT INTO notifications (id, user_id, title, body, href, read_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)',
    nid('ntf'), userId, title, body, href, Date.now(),
  );
}

export async function notifyShift(conductorId: string, busId: string, state: 'started' | 'ended') {
  const details = await (await getDb()).get<{ owner_id: string; fleet_number: string; name: string }>(
    'SELECT b.owner_id, b.fleet_number, u.name FROM buses b CROSS JOIN users u WHERE b.id = ? AND u.id = ?',
    busId, conductorId,
  );
  if (details) {
    await notifyUser(details.owner_id, `Shift ${state}`, `${details.name} ${state} a shift on Bus ${details.fleet_number}.`, '/business/desk/assignments');
  }
}
