import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // 이미지 최적화 활성화 (성능 향상)
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
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
    // 성능 최적화 플래그들
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'date-fns',
    ],
  },
  // Webpack 최적화
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 프로덕션에서 소스맵 제거 (번들 크기 감소)
    if (!dev && !isServer) {
      config.devtool = false
    }
    
    // 모듈 연결 최적화
    config.optimization.concatenateModules = true
    
    // 사용하지 않는 코드 제거 강화
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
    
    // 번들 분할 최적화
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all',
        },
        // UI 라이브러리 별도 청크
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
          name: 'ui-libs',
          priority: 10,
          chunks: 'all',
        },
        // 유틸리티 라이브러리 별도 청크
        utils: {
          test: /[\\/]node_modules[\\/](date-fns|lodash|ramda|clsx)[\\/]/,
          name: 'utils',
          priority: 5,
          chunks: 'all',
        },
      },
    }

    return config
  },
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  // 압축 최적화
  compress: true,
  // 파워 캐싱
  poweredByHeader: false,
  // HTTP 헤더 최적화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
