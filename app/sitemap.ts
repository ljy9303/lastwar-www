import { MetadataRoute } from 'next'
import { seoConfig } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = seoConfig.siteUrl
  const now = new Date()

  // 정적 페이지들
  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/surveys`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/desert-results`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/users`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/squads`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/board`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/votes`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/lottery`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/post-events`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    }
  ]

  // 인증 관련 페이지 (낮은 우선순위)
  const authPages = [
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.2,
    }
  ]

  return [...staticPages, ...authPages]
}

// 동적 sitemap을 위한 함수 (필요한 경우)
export async function generateSitemaps() {
  // 게시글이나 동적 콘텐츠가 많아질 경우 여기서 동적 sitemap 생성
  return [{ id: 0 }]
}