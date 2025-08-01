"use client"

/**
 * Core Web Vitals 및 성능 모니터링 유틸리티
 * 
 * LastWar 모바일 성능 최적화를 위한 성능 측정 도구
 */

// Core Web Vitals 임계값 정의
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint - 2.5초 이하 양호
  LCP: {
    good: 2500,
    needs_improvement: 4000,
  },
  // First Input Delay - 100ms 이하 양호
  FID: {
    good: 100,
    needs_improvement: 300,
  },
  // Cumulative Layout Shift - 0.1 이하 양호
  CLS: {
    good: 0.1,
    needs_improvement: 0.25,
  },
  // First Contentful Paint - 1.8초 이하 양호
  FCP: {
    good: 1800,
    needs_improvement: 3000,
  },
  // Time to First Byte - 800ms 이하 양호
  TTFB: {
    good: 800,
    needs_improvement: 1800,
  },
} as const

// 성능 메트릭 타입 정의
export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

// 성능 결과 저장소
class PerformanceStore {
  private metrics: PerformanceMetric[] = []
  private maxEntries = 100

  add(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // 최대 엔트리 수 제한
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries)
    }
    
    // 로컬 스토리지에 저장 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('performance-metrics', JSON.stringify(this.metrics))
      } catch (error) {
        console.warn('성능 메트릭 저장 실패:', error)
      }
    }
  }

  getAll(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getByPage(url: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.url === url)
  }

  getAverages(): Record<string, number> {
    const averages: Record<string, number> = {}
    const groupedMetrics: Record<string, number[]> = {}
    
    this.metrics.forEach(metric => {
      if (!groupedMetrics[metric.name]) {
        groupedMetrics[metric.name] = []
      }
      groupedMetrics[metric.name].push(metric.value)
    })
    
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      averages[name] = values.reduce((sum, value) => sum + value, 0) / values.length
    })
    
    return averages
  }

  clear() {
    this.metrics = []
    try {
      localStorage.removeItem('performance-metrics')
    } catch (error) {
      console.warn('성능 메트릭 삭제 실패:', error)
    }
  }
}

// 글로벌 성능 스토어 인스턴스
export const performanceStore = new PerformanceStore()

/**
 * 성능 메트릭의 등급을 계산합니다
 */
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]
  
  if (!thresholds) return 'good'
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needs_improvement) return 'needs-improvement'
  return 'poor'
}

/**
 * 성능 메트릭을 기록합니다
 */
function recordMetric(name: string, value: number) {
  const metric: PerformanceMetric = {
    name,
    value,
    rating: getMetricRating(name, value),
    timestamp: Date.now(),
    url: window.location.pathname,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
  }
  
  performanceStore.add(metric)
  
  // 개발 환경에서 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'} (${metric.rating})`)
  }
}

/**
 * Core Web Vitals를 측정하고 기록합니다
 */
export function measureCoreWebVitals() {
  // Web Vitals 라이브러리 직접 import 시도
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB, onINP }) => {
      const handleMetric = (name: string) => (metric: any) => {
        recordMetric(name, metric.value)
      }
      
      onLCP(handleMetric('LCP'))
      onFID(handleMetric('FID'))
      onCLS(handleMetric('CLS'))
      onFCP(handleMetric('FCP'))
      onTTFB(handleMetric('TTFB'))
      onINP(handleMetric('INP')) // Interaction to Next Paint (새로운 메트릭)
    }).catch(() => {
      console.warn('Web Vitals 라이브러리를 불러올 수 없습니다. 대체 측정 방법을 사용합니다.')
      measureCoreWebVitalsFallback()
    })
    
    return
  }
}

/**
 * Performance Observer를 사용한 Fallback 측정
 */
function measureCoreWebVitalsFallback() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // LCP 측정
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          recordMetric('LCP', lastEntry.startTime)
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // FID 측정
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          recordMetric('FID', entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })

      // CLS 측정
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        recordMetric('CLS', clsValue)
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })

      // FCP 측정
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            recordMetric('FCP', entry.startTime)
          }
        })
      })
      fcpObserver.observe({ type: 'paint', buffered: true })

      // TTFB 측정
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any
      if (navigationEntry) {
        recordMetric('TTFB', navigationEntry.responseStart - navigationEntry.requestStart)
      }

    } catch (error) {
      console.warn('Performance Observer 설정 실패:', error)
    }
  }
}

/**
 * 페이지 로드 성능을 측정합니다
 */
export function measurePageLoad() {
  if (typeof window === 'undefined') return

  // DOM이 완전히 로드된 후 측정
  const measureLoadTimes = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as any
    
    if (navigation) {
      // DNS 조회 시간
      const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart
      recordMetric('DNS', dnsTime)
      
      // TCP 연결 시간
      const tcpTime = navigation.connectEnd - navigation.connectStart  
      recordMetric('TCP', tcpTime)
      
      // 서버 응답 시간
      const serverTime = navigation.responseEnd - navigation.requestStart
      recordMetric('Server', serverTime)
      
      // DOM 파싱 시간
      const domTime = navigation.domContentLoadedEventEnd - navigation.responseEnd
      recordMetric('DOM', domTime)
      
      // 전체 로드 시간
      const loadTime = navigation.loadEventEnd - navigation.navigationStart
      recordMetric('Load', loadTime)
    }
  }

  if (document.readyState === 'complete') {
    measureLoadTimes()
  } else {
    window.addEventListener('load', measureLoadTimes)
  }
}

/**
 * 리소스 로딩 성능을 측정합니다
 */
export function measureResourceLoading() {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    
    entries.forEach((entry: any) => {
      const resourceType = entry.initiatorType
      const loadTime = entry.responseEnd - entry.startTime
      
      // 주요 리소스 타입별 측정
      if (['script', 'stylesheet', 'img', 'fetch', 'xmlhttprequest'].includes(resourceType)) {
        recordMetric(`Resource-${resourceType}`, loadTime)
      }
    })
  })
  
  observer.observe({ type: 'resource', buffered: true })
}

/**
 * 메모리 사용량을 측정합니다 (Chrome에서만 지원)
 */
export function measureMemoryUsage() {
  if (typeof window === 'undefined') return
  
  // @ts-ignore
  if ('memory' in performance) {
    // @ts-ignore
    const memory = performance.memory
    
    recordMetric('MemoryUsed', memory.usedJSHeapSize / 1024 / 1024) // MB
    recordMetric('MemoryTotal', memory.totalJSHeapSize / 1024 / 1024) // MB
    recordMetric('MemoryLimit', memory.jsHeapSizeLimit / 1024 / 1024) // MB
  }
}

/**
 * 네트워크 정보를 기록합니다
 */
export function recordNetworkInfo() {
  if (typeof window === 'undefined') return
  
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  
  if (connection) {
    recordMetric('NetworkDownlink', connection.downlink || 0)
    recordMetric('NetworkRTT', connection.rtt || 0)
  }
}

/**
 * 성능 모니터링을 초기화합니다
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return
  
  // Core Web Vitals 측정
  measureCoreWebVitals()
  
  // 페이지 로드 성능 측정
  measurePageLoad()
  
  // 리소스 로딩 성능 측정
  measureResourceLoading()
  
  // 메모리 사용량 측정 (1분마다)
  measureMemoryUsage()
  setInterval(measureMemoryUsage, 60000)
  
  // 네트워크 정보 기록
  recordNetworkInfo()
  
  console.log('🚀 성능 모니터링이 초기화되었습니다')
}

/**
 * 성능 리포트를 생성합니다
 */
export function generatePerformanceReport() {
  const allMetrics = performanceStore.getAll()
  const averages = performanceStore.getAverages()
  
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    metrics: allMetrics,
    averages,
    summary: {
      totalMeasurements: allMetrics.length,
      coreWebVitals: {
        LCP: averages.LCP ? {
          value: averages.LCP,
          rating: getMetricRating('LCP', averages.LCP),
          threshold: PERFORMANCE_THRESHOLDS.LCP.good,
        } : null,
        FID: averages.FID ? {
          value: averages.FID,
          rating: getMetricRating('FID', averages.FID),
          threshold: PERFORMANCE_THRESHOLDS.FID.good,
        } : null,
        CLS: averages.CLS ? {
          value: averages.CLS,
          rating: getMetricRating('CLS', averages.CLS),
          threshold: PERFORMANCE_THRESHOLDS.CLS.good,
        } : null,
      },
      recommendations: generateRecommendations(averages),
    }
  }
  
  return report
}

/**
 * 성능 개선 권장사항을 생성합니다
 */
function generateRecommendations(averages: Record<string, number>): string[] {
  const recommendations: string[] = []
  
  // LCP 개선 권장사항
  if (averages.LCP && averages.LCP > PERFORMANCE_THRESHOLDS.LCP.good) {
    recommendations.push('🖼️ 이미지 최적화: WebP/AVIF 포맷 사용, lazy loading 적용')
    recommendations.push('📦 번들 크기 최적화: 코드 스플리팅, Tree shaking 적용')
  }
  
  // FID 개선 권장사항
  if (averages.FID && averages.FID > PERFORMANCE_THRESHOLDS.FID.good) {
    recommendations.push('⚡ JavaScript 최적화: 불필요한 렌더링 제거, useMemo/useCallback 사용')
    recommendations.push('🔄 메인 스레드 블로킹 최소화: Web Workers 사용 고려')
  }
  
  // CLS 개선 권장사항
  if (averages.CLS && averages.CLS > PERFORMANCE_THRESHOLDS.CLS.good) {
    recommendations.push('📐 레이아웃 안정화: 이미지/동영상 크기 명시, 폰트 로딩 최적화')
    recommendations.push('🎨 동적 콘텐츠 최적화: Skeleton UI 사용, 애니메이션 최적화')
  }
  
  // 메모리 사용량 권장사항
  if (averages.MemoryUsed && averages.MemoryUsed > 50) {
    recommendations.push('🧠 메모리 최적화: 이벤트 리스너 정리, 메모리 누수 방지')
  }
  
  // 네트워크 권장사항
  if (averages.NetworkRTT && averages.NetworkRTT > 300) {
    recommendations.push('🌐 네트워크 최적화: CDN 사용, 리소스 압축, HTTP/2 적용')
  }
  
  return recommendations
}

/**
 * React 컴포넌트 렌더링 성능을 측정합니다
 */
export function measureComponentRender(componentName: string) {
  return {
    start: () => {
      const startTime = performance.now()
      return {
        end: () => {
          const endTime = performance.now()
          recordMetric(`Component-${componentName}`, endTime - startTime)
        }
      }
    }
  }
}