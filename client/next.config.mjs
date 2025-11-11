/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://sih25180.onrender.com/api/:path*', // Proxy to Backend
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Optimize images and static assets
  images: {
    domains: ['localhost', 'sih25180.onrender.com'],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
