/**
 * 성능 최적화 유틸리티 함수들
 */

/**
 * 디바운스 함수 - 이벤트 최적화용
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 스로틀 함수 - 스크롤 이벤트 최적화용
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * RAF를 사용한 스로틀링 - 애니메이션 최적화용
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false
  return (...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args)
        ticking = false
      })
      ticking = true
    }
  }
}

/**
 * 가벼운 메모이제이션 - React.memo 대안
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()
  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * 지연 로딩을 위한 Intersection Observer 래퍼
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, defaultOptions)
}

/**
 * 가벼운 이벤트 에미터 - 커스텀 이벤트용
 */
export class LightEventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  clear(): void {
    this.events.clear()
  }
}

/**
 * CSS 클래스 이름 최적화 - clsx 경량 버전
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 모바일 디바이스 감지 (user agent 기반)
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * 터치 디바이스 감지
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 성능 측정 유틸리티
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map()

  start(name: string): void {
    this.marks.set(name, performance.now())
  }

  end(name: string): number {
    const start = this.marks.get(name)
    if (!start) {
      console.warn(`Performance mark "${name}" not found`)
      return 0
    }
    
    const duration = performance.now() - start
    this.marks.delete(name)
    return duration
  }

  measure(name: string, fn: () => void): number {
    this.start(name)
    fn()
    return this.end(name)
  }
}

/**
 * 지연 실행 유틸리티
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * 브라우저 호환성 체크
 */
export const browserSupports = {
  intersectionObserver: typeof IntersectionObserver !== 'undefined',
  webp: () => {
    if (typeof window === 'undefined') return false
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('webp') > -1
  },
  avif: () => {
    if (typeof window === 'undefined') return false
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/avif').indexOf('avif') > -1
  }
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * 배열 청크 분할 - 대용량 데이터 처리용
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}