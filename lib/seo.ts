import type { Metadata } from 'next'

// LastWar SEO 최적화 설정
export const seoConfig = {
  title: 'LastWar 연맹 관리 시스템',
  titleTemplate: '%s | LastWar 연맹 관리',
  description: 'LastWar 연맹 관리의 모든 것! 사막전 관리, 연맹원 관리, 공략 공유, 투표 시스템을 한 곳에서. LastWar 최고의 연맹 관리 플랫폼.',
  keywords: [
    'LastWar',
    'LastWar 연맹 관리',
    'LastWar 사막전 관리', 
    'LastWar 공략',
    'LastWar 연맹',
    'LastWar 사막전',
    'LastWar 투표',
    'LastWar 전략',
    'LastWar 길드',
    'LastWar 게임',
    '연맹 관리 시스템',
    '사막전 관리 툴',
    '게임 연맹 관리',
    '모바일 게임 관리'
  ],
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lastwar-www.vercel.app',
  ogImage: '/og-image.png',
  twitterHandle: '@LastWarKorea'
}

export interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  canonicalUrl?: string
  noIndex?: boolean
}

// 페이지별 SEO 메타데이터 정의
export const pageMetadata: Record<string, PageMetadata> = {
  // 메인 페이지
  '/': {
    title: 'LastWar 연맹 관리 시스템 - 사막전 관리의 새로운 기준',
    description: 'LastWar 연맹 관리의 모든 것을 한 곳에서! 사막전 관리, 연맹원 관리, 공략 공유, 실시간 투표까지. LastWar 최고의 연맹 관리 플랫폼으로 당신의 연맹을 강화하세요.',
    keywords: ['LastWar 연맹 관리', 'LastWar 사막전 관리', 'LastWar 공략', 'LastWar 연맹 시스템']
  },
  
  // 사막전 관리
  '/events': {
    title: 'LastWar 사막전 관리 - 실시간 이벤트 관리 시스템',
    description: 'LastWar 사막전을 체계적으로 관리하세요. 실시간 이벤트 현황, 참여자 관리, 결과 분석까지. 효율적인 사막전 관리의 핵심 도구입니다.',
    keywords: ['LastWar 사막전 관리', 'LastWar 이벤트 관리', 'LastWar 사막전', '사막전 관리 툴']
  },
  
  '/surveys': {
    title: 'LastWar 사막전 사전조사 - 스마트한 전략 수립',
    description: 'LastWar 사막전 참여 전 체계적인 사전조사로 최적의 전략을 수립하세요. 팀 구성, 선호도 조사, 참여 의향 파악까지 한 번에.',
    keywords: ['LastWar 사막전 사전조사', 'LastWar 전략 수립', 'LastWar 팀 구성', '사막전 준비']
  },
  
  '/desert-results': {
    title: 'LastWar 사막전 결과 - 상세한 전투 분석 리포트',
    description: 'LastWar 사막전 결과를 상세하게 분석하고 리포트로 확인하세요. 팀별 성과, 개인 기여도, 전략 효과성까지 데이터 기반 분석 제공.',
    keywords: ['LastWar 사막전 결과', 'LastWar 전투 분석', 'LastWar 성과 리포트', '사막전 통계']
  },
  
  // 연맹 관리
  '/users': {
    title: 'LastWar 연맹원 관리 - 체계적인 멤버 관리 시스템',
    description: 'LastWar 연맹원을 효율적으로 관리하세요. 멤버 정보, 활동 현황, 권한 관리, 기여도 평가까지. 강력한 연맹을 위한 필수 도구입니다.',
    keywords: ['LastWar 연맹원 관리', 'LastWar 멤버 관리', 'LastWar 길드 관리', '연맹 관리 시스템']
  },
  
  '/squads': {
    title: 'LastWar 부대 관리 - 전략적 팀 구성과 관리',
    description: 'LastWar 부대를 전략적으로 구성하고 관리하세요. 부대별 역할 분담, 전력 분석, 배치 최적화로 승리를 이끄는 부대를 만들어보세요.',
    keywords: ['LastWar 부대 관리', 'LastWar 팀 구성', 'LastWar 전략', '부대 배치 최적화']
  },
  
  // 커뮤니티
  '/board': {
    title: 'LastWar 공략 게시판 - 최신 전략과 팁 공유',
    description: 'LastWar 공략 정보를 공유하고 소통하세요. 최신 업데이트 정보, 전략 가이드, 팁과 노하우까지. LastWar 마스터들의 지식이 모인 곳입니다.',
    keywords: ['LastWar 공략', 'LastWar 전략', 'LastWar 팁', 'LastWar 가이드', 'LastWar 커뮤니티']
  },
  
  '/votes': {
    title: 'LastWar 연맹 투표 - 민주적인 의사결정 시스템',
    description: 'LastWar 연맹 내 중요한 사안을 투표로 결정하세요. 투명하고 공정한 의사결정으로 더 강한 연맹을 만들어가세요.',
    keywords: ['LastWar 연맹 투표', 'LastWar 의사결정', '연맹 민주주의', 'LastWar 거버넌스']
  },
  
  // 기타 페이지
  '/login': {
    title: 'LastWar 연맹 관리 로그인',
    description: 'LastWar 연맹 관리 시스템에 로그인하여 강력한 관리 도구를 이용하세요.',
    noIndex: true
  },
  
  '/signup': {
    title: 'LastWar 연맹 관리 회원가입',
    description: 'LastWar 연맹 관리 시스템에 가입하여 체계적인 연맹 운영을 시작하세요.',
    noIndex: true
  }
}

// 메타데이터 생성 함수
export function generateMetadata(
  pathname: string,
  customMetadata?: Partial<PageMetadata>
): Metadata {
  const pageData = pageMetadata[pathname] || pageMetadata['/']
  const merged = { ...pageData, ...customMetadata }
  
  const title = merged.title
  const description = merged.description
  const keywords = [...seoConfig.keywords, ...(merged.keywords || [])]
  const canonicalUrl = merged.canonicalUrl || `${seoConfig.siteUrl}${pathname}`
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'LastWar Korea Team' }],
    creator: 'LastWar Korea',
    publisher: 'LastWar Korea',
    robots: merged.noIndex ? 'noindex, nofollow' : 'index, follow',
    canonical: canonicalUrl,
    
    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: canonicalUrl,
      title,
      description,
      siteName: seoConfig.title,
      images: [
        {
          url: `${seoConfig.siteUrl}${seoConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title,
      description,
      images: [`${seoConfig.siteUrl}${seoConfig.ogImage}`],
    },
    
    // 추가 메타 태그
    other: {
      'application-name': seoConfig.title,
      'apple-mobile-web-app-title': seoConfig.title,
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      
      // 한국어 특화
      'content-language': 'ko',
      'geo.region': 'KR',
      'geo.country': 'Korea',
      
      // LastWar 게임 관련
      'game.category': 'strategy',
      'game.platform': 'mobile',
      'game.genre': 'war,strategy,management',
    }
  }
}

// JSON-LD 구조화 데이터 생성
export function generateJsonLd(pathname: string) {
  const pageData = pageMetadata[pathname] || pageMetadata['/']
  
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.title,
    description: seoConfig.description,
    url: seoConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'ko-KR',
    copyrightYear: new Date().getFullYear(),
    creator: {
      '@type': 'Organization',
      name: 'LastWar Korea Team',
      url: seoConfig.siteUrl
    }
  }
  
  // 페이지별 특화 구조화 데이터
  const pageSpecificData: Record<string, any> = {
    '/': {
      ...baseStructuredData,
      '@type': 'WebApplication',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock'
      }
    },
    
    '/board': {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'LastWar 공략 게시판',
      description: pageData.description,
      url: `${seoConfig.siteUrl}/board`,
      mainEntity: {
        '@type': 'ItemList',
        name: 'LastWar 공략 글 목록',
        description: 'LastWar 관련 공략, 전략, 팁을 공유하는 게시판'
      }
    }
  }
  
  return pageSpecificData[pathname] || baseStructuredData
}