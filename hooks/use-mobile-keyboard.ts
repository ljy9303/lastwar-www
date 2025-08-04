"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface MobileKeyboardState {
  /** 키보드가 현재 표시되어 있는지 */
  isVisible: boolean
  /** 키보드 높이 (픽셀) */
  height: number
  /** 뷰포트 높이 (키보드 제외) */
  viewportHeight: number
  /** 전체 화면 높이 */
  screenHeight: number
  /** 키보드 상태 변화 중인지 */
  isTransitioning: boolean
}

interface UseMobileKeyboardOptions {
  /** 키보드 감지 임계값 (기본: 150px) */
  threshold?: number
  /** 상태 변화 디바운스 시간 (ms, 기본: 150) */
  debounceMs?: number
  /** 트랜지션 시간 (ms, 기본: 300) */
  transitionMs?: number
}

/**
 * 모바일 가상 키보드 상태를 감지하는 훅
 * 
 * Visual Viewport API를 우선 사용하고, 폴백으로 window.innerHeight 변화를 감지합니다.
 * iOS Safari와 Android Chrome에서 모두 안정적으로 작동합니다.
 * 
 * @param options 키보드 감지 옵션
 * @returns 키보드 상태 정보
 */
export function useMobileKeyboard(options: UseMobileKeyboardOptions = {}): MobileKeyboardState {
  const {
    threshold = 150,
    debounceMs = 150,
    transitionMs = 300
  } = options

  const [keyboardState, setKeyboardState] = useState<MobileKeyboardState>({
    isVisible: false,
    height: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    isTransitioning: false
  })

  const debounceTimer = useRef<NodeJS.Timeout>()
  const transitionTimer = useRef<NodeJS.Timeout>()
  const initialViewportHeight = useRef<number>(0)

  // Visual Viewport API 지원 여부 확인
  const supportsVisualViewport = typeof window !== 'undefined' && 'visualViewport' in window

  // 키보드 상태 업데이트 함수
  const updateKeyboardState = useCallback((immediate = false) => {
    if (typeof window === 'undefined') return

    const updateState = () => {
      let currentHeight: number
      let isKeyboardVisible: boolean
      let keyboardHeight: number

      if (supportsVisualViewport && window.visualViewport) {
        // Visual Viewport API 사용 (정확함)
        const visualViewport = window.visualViewport
        currentHeight = visualViewport.height
        keyboardHeight = window.innerHeight - visualViewport.height
        isKeyboardVisible = keyboardHeight > threshold
      } else {
        // 폴백: window.innerHeight 변화 감지
        currentHeight = window.innerHeight
        const heightDifference = initialViewportHeight.current - currentHeight
        keyboardHeight = Math.max(0, heightDifference)
        isKeyboardVisible = heightDifference > threshold
      }

      setKeyboardState(prev => {
        const stateChanged = 
          prev.isVisible !== isKeyboardVisible ||
          Math.abs(prev.height - keyboardHeight) > 10 ||
          Math.abs(prev.viewportHeight - currentHeight) > 10

        if (!stateChanged) return prev

        // 트랜지션 상태 설정
        if (transitionTimer.current) {
          clearTimeout(transitionTimer.current)
        }

        const newState: MobileKeyboardState = {
          isVisible: isKeyboardVisible,
          height: keyboardHeight,
          viewportHeight: currentHeight,
          screenHeight: window.screen.height,
          isTransitioning: true
        }

        // 트랜지션 완료 후 isTransitioning을 false로 설정
        transitionTimer.current = setTimeout(() => {
          setKeyboardState(current => ({
            ...current,
            isTransitioning: false
          }))
        }, transitionMs)

        return newState
      })
    }

    if (immediate || debounceMs === 0) {
      updateState()
    } else {
      // 디바운스 적용
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(updateState, debounceMs)
    }
  }, [supportsVisualViewport, threshold, debounceMs, transitionMs])

  // 초기화 및 이벤트 리스너 등록
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 초기 뷰포트 높이 저장
    initialViewportHeight.current = window.innerHeight

    // 초기 상태 설정
    updateKeyboardState(true)

    let removeListeners: (() => void)[] = []

    if (supportsVisualViewport && window.visualViewport) {
      // Visual Viewport API 리스너
      const handleVisualViewportResize = () => updateKeyboardState()
      const handleVisualViewportScroll = () => updateKeyboardState()

      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportScroll)

      removeListeners.push(() => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport?.removeEventListener('scroll', handleVisualViewportScroll)
      })
    } else {
      // 폴백: 기존 이벤트 리스너들
      const handleResize = () => updateKeyboardState()
      const handleOrientationChange = () => {
        // 방향 변경 시 초기 높이 재설정
        setTimeout(() => {
          initialViewportHeight.current = window.innerHeight
          updateKeyboardState(true)
        }, 500) // 방향 변경 애니메이션 완료 대기
      }

      window.addEventListener('resize', handleResize, { passive: true })
      window.addEventListener('orientationchange', handleOrientationChange, { passive: true })

      removeListeners.push(() => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleOrientationChange)
      })
    }

    // 포커스 이벤트도 추가로 감지 (입력 필드 포커스 시)
    const handleFocusIn = () => {
      // 입력 필드 포커스 시 약간의 지연 후 상태 업데이트
      setTimeout(() => updateKeyboardState(), 300)
    }
    const handleFocusOut = () => {
      setTimeout(() => updateKeyboardState(), 300)
    }

    document.addEventListener('focusin', handleFocusIn, { passive: true })
    document.addEventListener('focusout', handleFocusOut, { passive: true })

    removeListeners.push(() => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    })

    // 클린업 함수
    return () => {
      removeListeners.forEach(remove => remove())
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current)
      }
    }
  }, [updateKeyboardState, supportsVisualViewport])

  return keyboardState
}

/**
 * 키보드 상태에 따른 CSS 변수를 자동으로 설정하는 훅
 * 
 * CSS에서 다음 변수들을 사용할 수 있습니다:
 * - --keyboard-height: 키보드 높이 (px)
 * - --viewport-height: 키보드를 제외한 뷰포트 높이 (px)
 * - --keyboard-visible: 키보드 표시 여부 (1 또는 0)
 * 
 * @param options 키보드 감지 옵션
 * @returns 키보드 상태 정보
 */
export function useMobileKeyboardWithCSSVars(options?: UseMobileKeyboardOptions): MobileKeyboardState {
  const keyboardState = useMobileKeyboard(options)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--keyboard-height', `${keyboardState.height}px`)
    root.style.setProperty('--viewport-height', `${keyboardState.viewportHeight}px`)
    root.style.setProperty('--keyboard-visible', keyboardState.isVisible ? '1' : '0')
  }, [keyboardState])

  return keyboardState
}

/**
 * 사용 예시:
 * 
 * // 기본 사용법
 * const keyboard = useMobileKeyboard()
 * 
 * // 채팅 입력창 조정
 * const chatInputStyle = {
 *   bottom: keyboard.isVisible ? keyboard.height : 0,
 *   transition: keyboard.isTransitioning ? 'bottom 0.3s ease-out' : 'none'
 * }
 * 
 * // CSS 변수 자동 설정
 * const keyboardWithCSS = useMobileKeyboardWithCSSVars()
 * 
 * // CSS에서 사용:
 * // .chat-container {
 * //   height: calc(100vh - var(--keyboard-height, 0px));
 * // }
 */