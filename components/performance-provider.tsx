"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePerformanceMonitoring, useMemoryMonitoring, useNetworkMonitoring } from '@/hooks/use-performance'

interface PerformanceContextType {
  isPerformanceMode: boolean
  setPerformanceMode: (enabled: boolean) => void
  memoryInfo: {
    used: number
    total: number
    limit: number
  } | null
  networkInfo: {
    effectiveType: string
    downlink: number
    rtt: number
    isSlowConnection: boolean
  } | null
  generateReport: () => any
  clearMetrics: () => void
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  // 운영 환경에서는 성능 모니터링을 완전히 비활성화
  const shouldEnableMonitoring = process.env.NODE_ENV === 'development' || 
                                process.env.NEXT_PUBLIC_PERFORMANCE_MODE === 'true'
  
  if (!shouldEnableMonitoring) {
    // 운영 환경에서는 성능 Hook들을 실행하지 않음
    return <>{children}</>
  }

  return <PerformanceProviderImpl>{children}</PerformanceProviderImpl>
}

function PerformanceProviderImpl({ children }: { children: React.ReactNode }) {
  const [isPerformanceMode, setIsPerformanceMode] = useState(true) // 개발환경에서는 기본 활성화
  const { getReport, clearMetrics } = usePerformanceMonitoring()
  const { memoryInfo } = useMemoryMonitoring()
  const networkInfo = useNetworkMonitoring()

  const generateReport = () => {
    return getReport()
  }

  const setPerformanceMode = (enabled: boolean) => {
    setIsPerformanceMode(enabled)
    if (enabled) {
      console.log('🚀 성능 모니터링 모드 활성화')
    } else {
      console.log('⏸️ 성능 모니터링 모드 비활성화')
    }
  }

  return (
    <PerformanceContext.Provider
      value={{
        isPerformanceMode,
        setPerformanceMode,
        memoryInfo,
        networkInfo,
        generateReport,
        clearMetrics,
      }}
    >
      {children}
      {isPerformanceMode && <PerformanceIndicator />}
    </PerformanceContext.Provider>
  )
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider')
  }
  return context
}

/**
 * 성능 지표를 시각적으로 표시하는 컴포넌트
 */
function PerformanceIndicator() {
  const { memoryInfo, networkInfo, generateReport } = usePerformanceContext()
  const [isVisible, setIsVisible] = useState(false)

  // 더블클릭으로 성능 패널 토글
  useEffect(() => {
    const handleDoubleClick = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible)
      }
    }
    
    window.addEventListener('keydown', handleDoubleClick)
    return () => window.removeEventListener('keydown', handleDoubleClick)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded cursor-pointer z-50"
        onClick={() => setIsVisible(true)}
        title="성능 모니터링 (Ctrl+Shift+P)"
      >
        📊
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-4 rounded-lg shadow-lg z-50 min-w-64">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">성능 모니터링</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="hover:bg-white/20 p-1 rounded"
        >
          ✕
        </button>
      </div>
      
      {/* 메모리 정보 */}
      {memoryInfo && (
        <div className="mb-2">
          <div className="text-green-400">메모리</div>
          <div className="ml-2">
            <div>사용: {memoryInfo.used}MB</div>
            <div>전체: {memoryInfo.total}MB</div>
            <div>제한: {memoryInfo.limit}MB</div>
            <div className="bg-gray-700 h-1 rounded overflow-hidden mt-1">
              <div 
                className={`h-full transition-all ${
                  memoryInfo.used / memoryInfo.limit > 0.8 ? 'bg-red-500' : 
                  memoryInfo.used / memoryInfo.limit > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(memoryInfo.used / memoryInfo.limit) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 네트워크 정보 */}
      {networkInfo && (
        <div className="mb-2">
          <div className="text-blue-400">네트워크</div>
          <div className="ml-2">
            <div>타입: {networkInfo.effectiveType}</div>
            <div>속도: {networkInfo.downlink}Mbps</div>
            <div>RTT: {networkInfo.rtt}ms</div>
            {networkInfo.isSlowConnection && (
              <div className="text-red-400">⚠️ 느린 연결</div>
            )}
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            const report = generateReport()
            console.log('📊 성능 리포트:', report)
            // JSON 파일로 다운로드
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `performance-report-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          리포트
        </button>
        <button
          onClick={() => {
            // Web Vitals 측정 강제 실행
            if (typeof window !== 'undefined' && 'web-vitals' in window) {
              // @ts-ignore
              window['web-vitals'].getCLS(console.log)
              // @ts-ignore
              window['web-vitals'].getFID(console.log)
              // @ts-ignore
              window['web-vitals'].getLCP(console.log)
            }
          }}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          측정
        </button>
      </div>
    </div>
  )
}