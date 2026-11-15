/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'http',
        hostname: '**'
      }
    ]
  },
  async rewrites() {
    const backendTarget = process.env.API_INTERNAL_URL || 'http://localhost:5006';
    const cdnTarget = process.env.CDN_PROXY_URL || backendTarget;
    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget}/api/:path*`
      },
      {
        source: '/cdn/:path*',
        destination: `${cdnTarget}/cdn/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${cdnTarget}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;

