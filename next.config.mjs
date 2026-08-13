/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api-mail/:path*',
        destination: 'https://api.mail.tm/:path*',
      },
    ]
  },
};

export default nextConfig;
