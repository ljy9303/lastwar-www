"use client"

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  initPerformanceMonitoring,
  generatePerformanceReport,
  measureComponentRender,
  performanceStore
} from '@/lib/performance-monitor'

/**
 * 성능 모니터링 Hook
 * 
 * Core Web Vitals 측정 및 성능 최적화를 위한 React Hook
 */
export function usePerformanceMonitoring() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      initPerformanceMonitoring()
      initialized.current = true
    }
  }, [])

  const getReport = useCallback(() => {
    return generatePerformanceReport()
  }, [])

  const clearMetrics = useCallback(() => {
    performanceStore.clear()
  }, [])

  const getMetrics = useCallback(() => {
    return performanceStore.getAll()
  }, [])

  return {
    getReport,
    clearMetrics,
    getMetrics,
  }
}

/**
 * 컴포넌트 렌더링 성능 측정 Hook
 */
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number>(0)

  useEffect(() => {
    renderCount.current += 1
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      lastRenderTime.current = renderTime
      
      // 렌더링 시간이 16ms (60fps) 이상이면 경고
      if (renderTime > 16) {
        console.warn(`⚠️ ${componentName} 렌더링 시간: ${renderTime.toFixed(2)}ms (권장: 16ms 이하)`)
      }
    }
  })

  const measureRender = useCallback(() => {
    return measureComponentRender(componentName)
  }, [componentName])

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    measureRender,
  }
}

/**
 * 메모이제이션 최적화 Hook
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const previousDeps = useRef<React.DependencyList>()
  const memoizedValue = useRef<T>()
  const computeCount = useRef(0)

  const hasChanged = useMemo(() => {
    if (!previousDeps.current) return true
    
    return deps.some((dep, index) => 
      !Object.is(dep, previousDeps.current?.[index])
    )
  }, deps)

  if (hasChanged) {
    const startTime = performance.now()
    memoizedValue.current = factory()
    const computeTime = performance.now() - startTime
    
    computeCount.current += 1
    previousDeps.current = deps

    // 디버그 정보 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.log(
        `🔄 ${debugName} 재계산: ${computeTime.toFixed(2)}ms (총 ${computeCount.current}번)`
      )
    }
  }

  return memoizedValue.current as T
}

/**
 * 디바운스된 콜백 Hook (성능 최적화)
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // 콜백 참조 업데이트
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [...deps, delay]
  )

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 가상화된 리스트 Hook (대용량 데이터 성능 최적화)
 */
export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    }
  }, [items, itemHeight, containerHeight, scrollTop, overscan])

  const handleScroll = useOptimizedCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop)
    },
    [],
    16 // 60fps에 맞춘 디바운스
  )

  return {
    visibleItems,
    handleScroll,
  }
}

/**
 * 이미지 lazy loading Hook
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const currentRef = imgRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [options])

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image()
      img.onload = () => setIsLoaded(true)
      img.src = src
    }
  }, [isInView, isLoaded, src])

  return {
    imgRef,
    isLoaded,
    isInView,
    shouldLoad: isInView,
  }
}

/**
 * 메모리 사용량 모니터링 Hook
 */
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number
    total: number
    limit: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      // @ts-ignore
      if ('memory' in performance) {
        // @ts-ignore
        const memory = performance.memory
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        })
      }
    }

    updateMemoryInfo()
    // 메모리 모니터링 간격을 30초로 조정하여 성능 오버헤드 감소
    const interval = setInterval(updateMemoryInfo, 30000) // 30초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  const isMemoryHigh = useMemo(() => {
    if (!memoryInfo) return false
    return (memoryInfo.used / memoryInfo.limit) > 0.8 // 80% 이상이면 높음
  }, [memoryInfo])

  return {
    memoryInfo,
    isMemoryHigh,
  }
}

/**
 * 네트워크 상태 모니터링 Hook
 */
export function useNetworkMonitoring() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string
    downlink: number
    rtt: number
    isSlowConnection: boolean
  } | null>(null)

  useEffect(() => {
    const updateNetworkInfo = () => {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      if (connection) {
        const info = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
        }
        setNetworkInfo(info)
      }
    }

    updateNetworkInfo()

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo)
      return () => connection.removeEventListener('change', updateNetworkInfo)
    }
  }, [])

  return networkInfo
}

import { useState } from 'react'