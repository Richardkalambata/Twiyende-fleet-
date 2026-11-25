import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintBusSign } from '@/components/print-bus-sign';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { getPrintableBus } from '@/lib/service';

export const metadata = { title: 'Printable bus sign' };

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export default async function BusSignPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ role?: string }>;
}) {
  const [{ id }, { role }] = await Promise.all([params, searchParams]);
  let user = await requireUser(role === 'conductor' ? ['conductor'] : role === 'operator' ? ['operator'] : ['operator', 'conductor']);
  let bus = await getPrintableBus(user, id);
  if (!bus && !role && user.role === 'operator') {
    const conductor = await getCurrentUser('conductor');
    if (conductor) {
      user = conductor;
      bus = await getPrintableBus(user, id);
    }
  }
  if (!bus) notFound();

  const url = new URL('/login', process.env.TWENDE_PUBLIC_ORIGIN || 'https://twende-fleet-refresh.vercel.app');
  url.searchParams.set('bus', bus.fleet_number);
  const { modules } = QRCode.create(url.href, { errorCorrectionLevel: 'M' });
  const qr = Array.from(modules.data, (module, index) =>
    module ? `M${index % modules.size + 4},${Math.floor(index / modules.size) + 4}h1v1h-1z` : '',
  ).join('');
  const qrScale = 320 / (modules.size + 8);
  const info = [bus.plate, bus.route].filter(Boolean).join(' · ');
  const sign = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123" width="794" height="1123">
    <rect width="794" height="1123" fill="white"/>
    <rect x="26" y="26" width="742" height="1071" rx="24" fill="none" stroke="#081a3f" stroke-width="4"/>
    <g font-family="Arial, sans-serif" text-anchor="middle" fill="#081a3f">
      <text x="397" y="138" font-size="42" font-weight="bold">TWENDE · PAY YOUR FARE</text>
      <text x="397" y="231" font-size="39" font-weight="bold">BUS NUMBER</text>
      <text x="397" y="478" font-size="248" font-weight="bold">${escapeXml(bus.fleet_number)}</text>
      <text x="397" y="535" font-size="${info.length > 48 ? 15 : 22}">${escapeXml(info)}</text>
      <text x="397" y="927" font-size="34" font-weight="bold">Scan with your phone camera</text>
      <text x="397" y="983" font-size="24">Or enter this bus number in Twende</text>
    </g>
    <path fill="#000" shape-rendering="crispEdges" transform="translate(237 560) scale(${qrScale})" d="${qr}"/>
  </svg>`;
  const image = `data:image/svg+xml;base64,${Buffer.from(sign).toString('base64')}`;

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-4 px-4 py-5 print:space-y-0 print:p-0">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Link href={user.role === 'operator' ? '/business/desk/buses' : '/business/drive'} className="font-semibold">Back</Link>
        <PrintBusSign />
        <a href={image} download={`twende-bus-${bus.fleet_number}.svg`} className="rounded-xl border px-4 py-2 font-semibold">Download sign</a>
      </div>
      <Image unoptimized src={image} width={794} height={1123} alt={`Bus ${bus.fleet_number}. ${info}. Scan the QR code or enter the bus number in Twende.`} className="h-auto w-full print:mx-auto print:max-h-[95vh] print:w-auto" />
    </main>
  );
}
