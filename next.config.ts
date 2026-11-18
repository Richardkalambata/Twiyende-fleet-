import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1440, 1920, 2560],
    imageSizes: [64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      { source: '/fleet', destination: '/business/desk', permanent: false },
      { source: '/fleet/:path*', destination: '/business/desk/:path*', permanent: false },
      { source: '/conductor', destination: '/business/drive', permanent: false },
      { source: '/conductor/:path*', destination: '/business/drive/:path*', permanent: false },
      { source: '/welcome', destination: '/', permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
