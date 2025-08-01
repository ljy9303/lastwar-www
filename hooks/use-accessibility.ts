"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * 접근성 향상을 위한 커스텀 훅들
 */

/**
 * 화면 읽기 프로그램 감지 훅
 */
export function useScreenReader() {
  const [isScreenReader, setIsScreenReader] = useState(false)

  useEffect(() => {
    // 화면 읽기 프로그램 감지 로직
    const detectScreenReader = () => {
      // 키보드 네비게이션 패턴 감지
      let tabKeyPressed = false
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          tabKeyPressed = true
          setIsScreenReader(true)
        }
      }

      // 보조 기술 API 확인
      const hasAccessibilityAPI = 'speechSynthesis' in window
      
      if (hasAccessibilityAPI || tabKeyPressed) {
        setIsScreenReader(true)
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }

    detectScreenReader()
  }, [])

  return isScreenReader
}

/**
 * 키보드 네비게이션 지원 훅
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < itemCount - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : itemCount - 1
        )
        break
        
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
        
      case 'End':
        e.preventDefault()
        setFocusedIndex(itemCount - 1)
        break
        
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && onSelect) {
          onSelect(focusedIndex)
        }
        break
        
      case 'Escape':
        setFocusedIndex(-1)
        break
    }
  }, [itemCount, focusedIndex, onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    focusedIndex,
    setFocusedIndex,
    containerRef,
    containerProps: {
      ref: containerRef,
      tabIndex: 0,
      role: 'listbox',
      'aria-activedescendant': focusedIndex >= 0 ? `item-${focusedIndex}` : undefined
    }
  }
}

/**
 * 라이브 알림 훅 (스크린 리더용)
 */
export function useLiveAnnouncer() {
  const liveRegionRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) {
      // 라이브 영역 동적 생성
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    const liveRegion = liveRegionRef.current
    liveRegion.setAttribute('aria-live', priority)
    
    // 메시지 업데이트 (스크린 리더가 읽도록)
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion.textContent = message
    }, 100)
  }, [])

  const announceSuccess = useCallback((message: string) => {
    announce(`성공: ${message}`, 'polite')
  }, [announce])

  const announceError = useCallback((message: string) => {
    announce(`오류: ${message}`, 'assertive')
  }, [announce])

  const announceLoading = useCallback((message: string) => {
    announce(`로딩 중: ${message}`, 'polite')
  }, [announce])

  return {
    announce,
    announceSuccess,
    announceError,
    announceLoading
  }
}

/**
 * 포커스 관리 훅
 */
export function useFocusManagement() {
  const focusedElementRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    focusedElementRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (focusedElementRef.current && focusedElementRef.current.focus) {
      focusedElementRef.current.focus()
    }
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    saveFocus,
    restoreFocus,
    trapFocus
  }
}

/**
 * 색상 대비 확인 유틸리티
 */
export function useColorContrast() {
  const checkContrast = useCallback((foreground: string, background: string) => {
    // 간단한 대비율 계산 (WCAG 기준)
    const getLuminance = (color: string) => {
      // RGB 값 추출 및 휘도 계산 로직
      // 실제 구현에서는 더 정교한 계산 필요
      return 0.5 // 임시값
    }

    const foregroundLum = getLuminance(foreground)
    const backgroundLum = getLuminance(background)
    
    const contrast = (Math.max(foregroundLum, backgroundLum) + 0.05) / 
                    (Math.min(foregroundLum, backgroundLum) + 0.05)

    return {
      ratio: contrast,
      isAACompliant: contrast >= 4.5,
      isAAACompliant: contrast >= 7
    }
  }, [])

  return { checkContrast }
}

/**
 * 동작 감소 선호도 확인 훅
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * 고대비 모드 확인 훅
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}