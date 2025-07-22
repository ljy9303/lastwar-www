/**
 * 성능 최적화 설정
 * 애니메이션 및 시각적 효과의 성능 제어
 */

// 캐시된 성능 모드 (한 번만 계산)
let cachedPerformanceMode: 'high' | 'low' | null = null

// 사용자 환경에 따른 성능 모드 감지 (lazy evaluation)
export const getPerformanceMode = (): 'high' | 'low' => {
  // SSR 환경에서는 항상 high 모드
  if (typeof window === 'undefined') return 'high'
  
  // 이미 계산된 값이 있으면 재사용
  if (cachedPerformanceMode !== null) {
    return cachedPerformanceMode
  }
  
  try {
    // Navigator API를 통한 성능 힌트 수집
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const deviceMemory = (navigator as any).deviceMemory
    const hardwareConcurrency = navigator.hardwareConcurrency
    
    // 저성능 디바이스 감지
    const isLowEnd = (
      deviceMemory && deviceMemory <= 2 || // 2GB 이하 RAM
      hardwareConcurrency && hardwareConcurrency <= 2 || // 2코어 이하 CPU
      connection && connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType) // 느린 네트워크
    )
    
    cachedPerformanceMode = isLowEnd ? 'low' : 'high'
    return cachedPerformanceMode
  } catch (error) {
    // 오류 시 high 모드로 fallback
    cachedPerformanceMode = 'high'
    return cachedPerformanceMode
  }
}

// 성능 설정 (getter 기반으로 변경하여 lazy evaluation)
export const performanceConfig = {
  get mode() {
    return getPerformanceMode()
  },
  
  // 애니메이션 설정
  get animations() {
    const mode = getPerformanceMode()
    return {
      enabled: mode === 'high',
      duration: mode === 'high' ? 0.15 : 0.08, // 저성능에서는 더 빠른 애니메이션
      easing: 'easeOut'
    }
  },
  
  // 메시지 렌더링 설정
  get messages() {
    const mode = getPerformanceMode()
    return {
      virtualizeThreshold: mode === 'high' ? 20 : 15, // 가상화 임계값
      maxVisible: mode === 'high' ? 30 : 20, // 최대 표시 메시지
      initialLoad: mode === 'high' ? 10 : 8 // 초기 로드 개수
    }
  },
  
  // GPU 가속 설정
  get gpu() {
    const mode = getPerformanceMode()
    return {
      enabled: mode === 'high',
      transform3d: mode === 'high' ? 'translateZ(0)' : 'none'
    }
  }
}

// 성능 모니터링
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window === 'undefined' || !window.performance) {
    fn()
    return
  }
  
  const start = performance.now()
  fn()
  const end = performance.now()
  
  // 개발 모드에서만 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
  }
}