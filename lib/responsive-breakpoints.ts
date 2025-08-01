/**
 * LastWar 모바일 최적화 브레이크포인트 시스템
 * 
 * 게임 인터페이스에 특화된 반응형 디자인 전략
 */

export const MOBILE_BREAKPOINTS = {
  // 초소형 모바일 (iPhone SE, 오래된 안드로이드)
  xs: 320,
  
  // 표준 모바일 (iPhone 12 Mini, Galaxy S series)  
  sm: 375,
  
  // 대형 모바일 (iPhone 14 Pro Max, Galaxy Note)
  md: 428,
  
  // 태블릿 세로모드 (iPad Mini)
  lg: 768,
  
  // 태블릿 가로모드 (iPad)
  xl: 1024,
  
  // 데스크톱 (일반 모니터)
  '2xl': 1280
} as const

/**
 * 뷰포트 크기별 최적 레이아웃 가이드라인
 */
export const LAYOUT_GUIDELINES = {
  // 320px - 375px: 초소형 모바일
  EXTRA_SMALL: {
    minTouchTarget: 44,
    padding: 12,
    fontSize: {
      title: 18,
      body: 14,
      caption: 12
    },
    cardWidth: '100%',
    gridCols: 1,
    navigation: 'bottom-tabs'
  },
  
  // 375px - 428px: 표준 모바일
  SMALL: {
    minTouchTarget: 44,
    padding: 16,
    fontSize: {
      title: 20,
      body: 16,
      caption: 14
    },
    cardWidth: '100%',
    gridCols: 1,
    navigation: 'bottom-tabs'
  },
  
  // 428px - 768px: 대형 모바일
  MEDIUM: {
    minTouchTarget: 48,
    padding: 20,
    fontSize: {
      title: 22,
      body: 16,
      caption: 14
    },
    cardWidth: '100%',
    gridCols: 2,
    navigation: 'bottom-tabs'
  },
  
  // 768px+: 태블릿/데스크톱
  LARGE: {
    minTouchTarget: 40,
    padding: 24,
    fontSize: {
      title: 24,
      body: 16,
      caption: 14
    },
    cardWidth: '320px',
    gridCols: 3,
    navigation: 'sidebar'
  }
} as const

/**
 * 디바이스별 최적화 설정
 */
export const DEVICE_OPTIMIZATIONS = {
  IOS: {
    // iOS Safari 특화 최적화
    preventZoom: true,
    dynamicViewport: true,
    safePadding: true,
    hapticFeedback: true
  },
  
  ANDROID: {
    // Android Chrome 특화 최적화
    preventZoom: true,
    hardwareAcceleration: true,
    gestureSupport: true,
    materialDesign: false // LastWar 자체 디자인 사용
  }
} as const

/**
 * 게임 특화 UI 가이드라인
 */
export const GAME_UI_GUIDELINES = {
  // 전투력, 레벨 등 게임 데이터 표시
  GAME_STATS: {
    fontSize: 16,
    fontWeight: 'bold',
    colorScheme: 'high-contrast'
  },
  
  // 유저 등급 배지
  USER_GRADES: {
    minSize: 32,
    borderRadius: 8,
    gradientSupport: true
  },
  
  // 액션 버튼 (참여, 편집, 삭제 등)
  ACTION_BUTTONS: {
    minHeight: 44,
    minWidth: 88,
    borderRadius: 8,
    rippleEffect: true
  },
  
  // 데이터 테이블
  DATA_TABLES: {
    mobileView: 'card-list',
    tabletView: 'condensed-table',
    desktopView: 'full-table'
  }
} as const

/**
 * 커스텀 미디어 쿼리 훅 타입
 */
export type BreakpointKey = keyof typeof MOBILE_BREAKPOINTS
export type LayoutGuide = keyof typeof LAYOUT_GUIDELINES
export type DeviceType = keyof typeof DEVICE_OPTIMIZATIONS