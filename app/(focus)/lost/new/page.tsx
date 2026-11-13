import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { ReportForm } from '@/components/report-form';
import { BackIcon } from '@/components/icons';
import { Wordmark } from '@/components/shell';
import { listReportableTrips } from '@/lib/service';

export const metadata = { title: 'Report lost item' };

export default async function ReportPage() {
  const user = await requireUser(['passenger']);
  const trips = await listReportableTrips(user.id);
  return (
    <div className="pt-3">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center">
          <Link href="/lost" className="grid h-14 w-14 place-items-center" aria-label="Back"><BackIcon /></Link>
          <h1 className="text-lg font-semibold">Report lost item</h1>
        </div>
        <Wordmark subtitle="Zambian minibuses" />
      </div>
      <div className="mt-2">
        <ReportForm trips={trips} />
      </div>
    </div>
  );
}
