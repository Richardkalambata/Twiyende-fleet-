import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { csvCell } from '@/lib/text';
import { formatHour24, lusakaDateKey } from '@/lib/time';
import { parseRange, ridesForExport } from '@/lib/service';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'operator') {
    return NextResponse.json({ message: 'Sign in as the owner to export.' }, { status: 401 });
  }
  const range = parseRange(new URL(request.url).searchParams.get('range') ?? undefined);
  const rows = await ridesForExport(user.id, range);
  const header = ['time', 'bus', 'plate', 'route', 'conductor', 'passenger', 'code', 'amount', 'status'];
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        `${lusakaDateKey(new Date(row.createdAt))} ${formatHour24(row.createdAt)}`,
        row.fleetNumber,
        row.plate,
        row.route,
        row.conductor,
        row.passenger,
        row.code,
        formatBalance(row.amountNgwee),
        row.status,
      ]
        .map((value) => csvCell(String(value)))
        .join(','),
    ),
  ];
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="twende-${range}.csv"`,
    },
  });
}
