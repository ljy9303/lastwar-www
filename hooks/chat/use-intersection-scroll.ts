/**
 * Intersection Observer 기반 스크롤 감지 훅
 * 성능 최적화된 무한 스크롤 트리거
 */

import { useEffect, useRef, useCallback } from 'react'

interface UseIntersectionScrollOptions {
  onLoadUp: () => void
  onLoadDown: () => void
  topThreshold: string
  bottomThreshold: string
  enabled: boolean
}

interface UseIntersectionScrollReturn {
  topSentinelRef: React.RefObject<HTMLDivElement>
  bottomSentinelRef: React.RefObject<HTMLDivElement>
}

export function useIntersectionScroll({
  onLoadUp,
  onLoadDown,
  topThreshold = '100px',
  bottomThreshold = '100px',
  enabled = true
}: UseIntersectionScrollOptions): UseIntersectionScrollReturn {
  
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  
  // 상단 스크롤 감지
  const topObserverRef = useRef<IntersectionObserver | null>(null)
  const bottomObserverRef = useRef<IntersectionObserver | null>(null)
  
  // 디바운스된 로드 함수들
  const debouncedLoadUp = useCallback(
    debounce(onLoadUp, 300),
    [onLoadUp]
  )
  
  const debouncedLoadDown = useCallback(
    debounce(onLoadDown, 300),
    [onLoadDown]
  )

  useEffect(() => {
    if (!enabled) return

    // 상단 옵저버 생성
    topObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            debouncedLoadUp()
          }
        })
      },
      {
        rootMargin: `${topThreshold} 0px 0px 0px`,
        threshold: 0
      }
    )

    // 하단 옵저버 생성
    bottomObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            debouncedLoadDown()
          }
        })
      },
      {
        rootMargin: `0px 0px ${bottomThreshold} 0px`,
        threshold: 0
      }
    )

    // 센티넬 요소 관찰 시작
    if (topSentinelRef.current) {
      topObserverRef.current.observe(topSentinelRef.current)
    }
    
    if (bottomSentinelRef.current) {
      bottomObserverRef.current.observe(bottomSentinelRef.current)
    }

    return () => {
      // 정리
      if (topObserverRef.current) {
        topObserverRef.current.disconnect()
      }
      if (bottomObserverRef.current) {
        bottomObserverRef.current.disconnect()
      }
    }
  }, [enabled, topThreshold, bottomThreshold, debouncedLoadUp, debouncedLoadDown])

  return {
    topSentinelRef,
    bottomSentinelRef
  }
}

// 디바운스 유틸리티
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}