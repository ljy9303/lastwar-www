"use client"

import { useState, useEffect } from 'react'
import { isMobileDevice, isTouchDevice } from '@/lib/performance-utils'

/**
 * 성능 최적화된 모바일 감지 Hook
 * - 불필요한 re-render 방지
 * - 초기 렌더링 시 서버-클라이언트 hydration 오류 최소화
 */

interface MobileDetection {
  isMobile: boolean
  isTouch: boolean
  isTablet: boolean
  orientation: 'portrait' | 'landscape'
  screenWidth: number
}

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useOptimizedMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>(() => ({
    isMobile: false, // SSR 안전을 위한 기본값
    isTouch: false,
    isTablet: false,
    orientation: 'portrait',
    screenWidth: 1024
  }))

  useEffect(() => {
    // 클라이언트에서만 실행
    const updateDetection = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDetection({
        isMobile: width < MOBILE_BREAKPOINT || isMobileDevice(),
        isTouch: isTouchDevice(),
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        orientation: width > height ? 'landscape' : 'portrait',
        screenWidth: width
      })
    }

    // 초기 감지
    updateDetection()

    // 리사이즈 이벤트 (debounced)
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateDetection, 150) // 디바운스로 성능 최적화
    }

    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return detection
}

/**
 * 간단한 모바일 감지 Hook (기존 호환성 유지)
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || isMobileDevice())
    }

    checkMobile()

    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 150)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return isMobile
}