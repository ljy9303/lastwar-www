"use client"

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react'

interface PerformanceContextType {
  measurePerformance: (name: string, fn: () => void | Promise<void>) => void
  logMemoryUsage: () => void
  isMonitoring: boolean
}

const PerformanceContext = createContext<PerformanceContextType>({
  measurePerformance: () => {},
  logMemoryUsage: () => {},
  isMonitoring: false
})

export const usePerformance = () => useContext(PerformanceContext)

interface PerformanceProviderProps {
  children: React.ReactNode
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // 성능 모니터링을 활성화할지 결정하는 더 엄격한 조건
  const shouldEnableMonitoring = useCallback(() => {
    // 운영 환경에서는 완전히 비활성화
    if (process.env.NODE_ENV === 'production') {
      return false
    }
    
    // 개발 환경에서도 명시적으로 활성화된 경우만 실행
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING !== 'true') {
      return false
    }
    
    // 브라우저 환경 체크
    if (typeof window === 'undefined') {
      return false
    }
    
    // 성능 API 지원 체크
    if (!window.performance || !window.performance.mark || !window.performance.measure) {
      return false
    }
    
    return true
  }, [])

  const isMonitoring = shouldEnableMonitoring()

  const measurePerformance = useCallback((name: string, fn: () => void | Promise<void>) => {
    if (!isMonitoring) {
      // 모니터링이 비활성화된 경우 함수만 실행
      fn()
      return
    }

    const startMark = `${name}-start`
    const endMark = `${name}-end`
    const measureName = `${name}-measure`

    try {
      performance.mark(startMark)
      
      const result = fn()
      
      if (result instanceof Promise) {
        result.finally(() => {
          performance.mark(endMark)
          performance.measure(measureName, startMark, endMark)
          
          const measure = performance.getEntriesByName(measureName)[0]
          if (measure) {
            console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`)
          }
          
          // 메모리 정리
          performance.clearMarks(startMark)
          performance.clearMarks(endMark)
          performance.clearMeasures(measureName)
        })
      } else {
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)
        
        const measure = performance.getEntriesByName(measureName)[0]
        if (measure) {
          console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`)
        }
        
        // 메모리 정리
        performance.clearMarks(startMark)
        performance.clearMarks(endMark)
        performance.clearMeasures(measureName)
      }
    } catch (error) {
      console.error(`Performance measurement failed for ${name}:`, error)
      // 에러가 발생해도 원래 함수는 실행
      fn()
    }
  }, [isMonitoring])

  const logMemoryUsage = useCallback(() => {
    if (!isMonitoring) return
    
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log(`📊 Memory Usage:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }, [isMonitoring])

  useEffect(() => {
    if (!isMonitoring) {
      return
    }

    // 메모리 모니터링 간격을 30초로 설정 (성능 부담 최소화)
    memoryCheckIntervalRef.current = setInterval(() => {
      logMemoryUsage()
    }, 30000)

    // 초기 메모리 상태 로그
    logMemoryUsage()

    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current)
      }
    }
  }, [isMonitoring, logMemoryUsage])

  const contextValue: PerformanceContextType = {
    measurePerformance,
    logMemoryUsage,
    isMonitoring
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}