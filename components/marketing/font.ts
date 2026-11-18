import localFont from 'next/font/local';

export const jakarta = localFont({
  src: [
    { path: '../../fonts/PlusJakartaSans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/PlusJakartaSans-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});
