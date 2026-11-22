export function GET() {
  return Response.json({
    id: '/business',
    name: 'Twende Fleet',
    short_name: 'Twende Fleet',
    description: 'Manage buses and verify fares on Twende Fleet.',
    start_url: '/business/login',
    scope: '/business/',
    display: 'standalone',
    background_color: '#F4F6FB',
    theme_color: '#0B1B3B',
    icons: [{ src: '/images/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }, { headers: { 'Content-Type': 'application/manifest+json' } });
}
