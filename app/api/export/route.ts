import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatBalance } from '@/lib/money';
import { csvCell } from '@/lib/text';
import { formatHour24, lusakaDateKey } from '@/lib/time';
import { fareArchiveYear, parseRange, ridesForExport } from '@/lib/service';

export async function GET(request: Request) {
  const user = await getCurrentUser('operator');
  if (!user || user.role !== 'operator') {
    return NextResponse.json({ message: 'Sign in as the owner to export.' }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const range = parseRange(params.get('range') ?? undefined);
  const year = fareArchiveYear(params.get('year') ?? undefined);
  const status = params.get('status');
  const rows = (await ridesForExport(user.id, range, year)).filter((row) => !status || row.status === status);
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
        row.status === 'verified' ? 'Complete' : row.status === 'pending' ? 'Pending' : 'Cancelled',
      ]
        .map((value) => csvCell(String(value)))
        .join(','),
    ),
  ];
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="twende-${year ?? range}.csv"`,
    },
  });
}
