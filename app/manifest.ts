import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Twende',
    short_name: 'Twende',
    description: 'Cashless minibus fares for Lusaka',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#0B5D3B',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
