import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/fleet', destination: '/business/desk', permanent: false },
      { source: '/fleet/:path*', destination: '/business/desk/:path*', permanent: false },
      { source: '/conductor', destination: '/business/drive', permanent: false },
      { source: '/conductor/:path*', destination: '/business/drive/:path*', permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
