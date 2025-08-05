/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 프로덕션 환경에서 console.log 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
}

export default nextConfig
