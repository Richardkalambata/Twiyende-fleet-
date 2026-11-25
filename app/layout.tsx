import type { Metadata, Viewport } from 'next';
import { MotionEngine, RouteShift } from '@/components/motion/engine';
import { Toaster } from '@/components/toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Twende', template: '%s · Twende' },
  description: 'Cashless minibus fares for Lusaka. Pay from your phone, confirm with a short code.',
  applicationName: 'Twende',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/images/icon.svg',
    apple: { url: '/images/twende-home-180.png', sizes: '180x180', type: 'image/png' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F4F6FB',
  colorScheme: 'only light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: `try{var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;var cores=navigator.hardwareConcurrency||8;var memory=navigator.deviceMemory;var low=cores<=4||(typeof memory==='number'&&memory<=2);document.documentElement.dataset.motion=(!reduced&&!low)?'rich':'simple';}catch(e){document.documentElement.dataset.motion='simple';}` }} />
        <MotionEngine />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <RouteShift>{children}</RouteShift>
        <Toaster />
      </body>
    </html>
  );
}
