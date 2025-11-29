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
  // Transpile packages that need it
  transpilePackages: ['@udecode/plate-math', 'katex', '@platejs/math', 'react-tweet'],
  
  // Webpack configuration to ignore CSS on server-side
  webpack: (config, { isServer }) => {
    if (isServer) {
      // On server-side, replace CSS imports with empty module
      config.resolve.alias = {
        ...config.resolve.alias,
        'katex/dist/katex.min.css': false,
      };
      
      // Add null-loader for CSS files from problematic packages on server-side
      config.module.rules.push({
        test: /katex\.min\.css$/,
        use: 'null-loader',
      });
      
      // Handle react-tweet CSS files on server-side
      config.module.rules.push({
        test: /\.module\.css$/,
        include: /react-tweet/,
        use: 'null-loader',
      });
    }
    
    return config;
  },
};

export default nextConfig;
