/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-bot/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3001/api/:path*' 
          : 'https://api.primegen.eu/api/:path*',
      },
    ]
  },
};

export default nextConfig;
