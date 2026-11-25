import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintBusSign } from '@/components/print-bus-sign';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { DEFAULT_FARE_ORIGIN } from '@/lib/bus-qr';
import { getPrintableBus } from '@/lib/service';

export const metadata = { title: 'Printable bus sign', robots: { index: false, follow: false } };

// Inline the app wordmark so the sign prints and downloads as a self-contained image.
const wordmark = `<g id="wordmark">
    <path fill="#1F5BFF" d="M22 26c0-12 1-17 8-20l17-5q3-1 2 3l-2 20 38-5c13-2 8 12-4 16-9 3-23 5-35 6v34c0 8 6 11 13 9l5-1c5 0 4 8-1 12-5 5-13 7-21 6-13-1-20-11-20-23V44L5 46q-5 1-4-4l3-8q1-4 5-5z"/>
    <g fill="inherit" fill-rule="evenodd">
      <path d="M63 42l14-2q2 0 3 3l8 32 11-33q1-3 4-3h8q3 0 4 3l10 33 10-33q1-3 4-3h11q3 0 2 3l-18 53q-1 2-3 2h-10q-3 0-4-2l-10-30-10 30q-1 2-3 2H81q-3 0-4-3L62 45q-1-3 1-3z"/>
      <path id="twende-e" d="M199 71h-37c1 9 7 15 15 15 5 0 10-2 14-6q2-2 4 1l3 6q1 3-1 5c-5 4-12 7-21 7-17 0-29-13-29-30s11-32 28-32c16 0 26 13 26 29q0 5-2 5zm-37-10h23c-1-8-5-12-11-12s-10 5-12 12z"/>
      <path d="M204 42q0-3 3-3h10q3 0 3 3v4c5-6 10-9 17-9 11 0 20 8 20 21v36q0 3-3 3h-10q-3 0-3-3V61c0-6-3-10-9-10-7 0-12 6-12 13v30q0 3-3 3h-10q-3 0-3-3z"/>
      <path d="M300 14q0-3 3-3h10q3 0 3 3v80q0 3-3 3h-9q-3 0-3-3v-5c-5 7-11 10-18 10-14 0-25-13-25-30s11-32 26-32c7 0 12 3 16 8zm0 54c0-11-5-18-12-18-8 0-13 8-13 19 0 10 5 17 13 17 7 0 12-7 12-18z"/>
      <use href="#twende-e" x="170"/>
    </g>
  </g>`;

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

  const url = new URL('/pay', process.env.TWENDE_PUBLIC_ORIGIN || DEFAULT_FARE_ORIGIN);
  url.searchParams.set('bus', bus.fleet_number);
  const { modules } = QRCode.create(url.href, { errorCorrectionLevel: 'M' });
  const qr = Array.from(modules.data, (module, index) =>
    module ? `M${index % modules.size + 4},${Math.floor(index / modules.size) + 4}h1v1h-1z` : '',
  ).join('');
  const qrSize = modules.size + 8;
  const info = [bus.plate, bus.route].filter(Boolean).join(' · ');
  const sign = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123" width="794" height="1123">
    <rect width="794" height="1123" fill="#FFFFFF"/>
    <rect x="20" y="20" width="754" height="1083" rx="20" fill="none" stroke="#081A3F" stroke-width="3"/>
    <svg x="277" y="66" width="240" height="66" viewBox="0 0 372 102" fill="#081A3F">${wordmark}</svg>
    <g font-family="Arial, sans-serif" text-anchor="middle" fill="#081A3F">
      <text x="397" y="230" font-size="65" font-weight="bold" letter-spacing="10">BUS</text>
      <text x="397" y="485" font-size="246" font-weight="bold">${escapeXml(bus.fleet_number)}</text>
      <text x="397" y="540" font-size="${info.length > 48 ? 16 : 22}">${escapeXml(info)}</text>
      <text x="397" y="975" font-size="42" font-weight="bold">Scan to pay your fare</text>
      <text x="397" y="1026" font-size="26">Or enter this bus number in Twende</text>
    </g>
    <svg x="219" y="567" width="356" height="356" viewBox="0 0 ${qrSize} ${qrSize}">
      <path fill="#000000" shape-rendering="crispEdges" d="${qr}"/>
    </svg>
  </svg>`;
  const image = `data:image/svg+xml;base64,${Buffer.from(sign).toString('base64')}`;

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-4 px-4 py-5 print:max-w-none print:space-y-0 print:p-0">
      <style>{`@media print {
        @page { size: A4 portrait; margin: 8mm; }
        html, body { background: white !important; }
      }`}</style>
      <div className="space-y-3 print:hidden">
        <Link href={user.role === 'operator' ? '/business/desk/buses' : '/business/drive'} className="inline-flex min-h-11 items-center font-semibold text-[#1747CB]">Back</Link>
        <h1 className="text-2xl font-extrabold">Bus {bus.fleet_number} sign</h1>
        <p className="text-sm text-[#5C6578]">Print the sign and place it where riders can see it as they board.</p>
        <div className="flex flex-wrap gap-2">
          <PrintBusSign image={image} filename={`twende-bus-${bus.fleet_number}`} />
        </div>
      </div>
      <Image unoptimized loading="eager" src={image} width={794} height={1123} alt={`Twende sign for Bus ${bus.fleet_number}. ${info}. Scan the QR code or enter the bus number in Twende.`} className="mx-auto h-auto w-full print:w-[186mm] print:max-w-full print:break-inside-avoid" />
    </main>
  );
}
