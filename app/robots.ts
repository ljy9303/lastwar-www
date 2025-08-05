import { MetadataRoute } from 'next'
import { seoConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = seoConfig.siteUrl

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/events',
          '/surveys',
          '/desert-results',
          '/users',
          '/squads',
          '/board',
          '/votes',
          '/lottery',
          '/post-events'
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/auth/*',
          '/login',
          '/signup',
          '/settings',
          '/test-login',
          '/_next/',
          '/static/',
          '/*.json$',
          '/*?*utm_*',
          '/*&*utm_*'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/events',
          '/surveys', 
          '/desert-results',
          '/users',
          '/squads',
          '/board',
          '/votes',
          '/lottery',
          '/post-events'
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/auth/*',
          '/login',
          '/signup',
          '/settings',
          '/test-login'
        ]
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/events',
          '/surveys',
          '/desert-results', 
          '/users',
          '/squads',
          '/board',
          '/votes'
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/auth/*'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}