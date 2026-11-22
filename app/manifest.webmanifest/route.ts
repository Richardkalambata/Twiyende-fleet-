import { appInstallIcons } from '@/lib/app-icons';

export function GET() {
  return Response.json({
    name: 'Twende',
    short_name: 'Twende',
    description: 'Cashless minibus fares for Lusaka',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#0B1B3B',
    icons: appInstallIcons,
  }, { headers: { 'Content-Type': 'application/manifest+json' } });
}
