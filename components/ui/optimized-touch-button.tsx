"use client"

import React, { useState, useRef, useCallback, forwardRef } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OptimizedTouchButtonProps extends ButtonProps {
  /** 햅틱 피드백 활성화 */
  enableHaptics?: boolean
  /** 리플 효과 활성화 */
  enableRipple?: boolean
  /** 터치 사운드 활성화 */
  enableSound?: boolean
  /** 최소 터치 타겟 크기 적용 */
  minTouchTarget?: boolean
  /** 터치 지연 시간 (ms) */
  touchDelay?: number
}

/**
 * 모바일 최적화된 터치 버튼 컴포넌트
 * - 44px 최소 터치 타겟 크기
 * - 햅틱 피드백 지원 (iOS/Android)
 * - 리플 애니메이션 효과
 * - 터치 최적화 CSS 적용
 */
const OptimizedTouchButton = forwardRef<HTMLButtonElement, OptimizedTouchButtonProps>(
  ({ 
    children, 
    className, 
    enableHaptics = true,
    enableRipple = true, 
    enableSound = false,
    minTouchTarget = true,
    touchDelay = 0,
    onClick,
    onTouchStart,
    onTouchEnd,
    ...props 
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false)
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
    const buttonRef = useRef<HTMLButtonElement>(null)
    const touchStartTime = useRef<number>(0)
    const rippleCounter = useRef(0)

    // 햅틱 피드백 실행
    const triggerHapticFeedback = useCallback(() => {
      if (!enableHaptics) return

      try {
        // iOS Haptic Engine
        if ('Haptics' in window) {
          ;(window as any).Haptics.impact({ style: 'light' })
        }
        // Android Vibration API
        else if ('vibrate' in navigator) {
          navigator.vibrate(10) // 10ms 짧은 진동
        }
        // Web Vibration API (PWA)
        else if ('serviceWorker' in navigator && 'vibrate' in navigator) {
          navigator.vibrate([10])
        }
      } catch (error) {
        // 햅틱 피드백 실패해도 무시 (선택적 기능)
        console.debug('Haptic feedback not available:', error)
      }
    }, [enableHaptics])

    // 터치 사운드 재생
    const playTouchSound = useCallback(() => {
      if (!enableSound) return

      try {
        // Web Audio API로 간단한 클릭 사운드 생성
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        console.debug('Touch sound not available:', error)
      }
    }, [enableSound])

    // 리플 효과 생성
    const createRipple = useCallback((event: React.TouchEvent | React.MouseEvent) => {
      if (!enableRipple) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left
      const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top

      const newRipple = {
        id: rippleCounter.current++,
        x,
        y
      }

      setRipples(prev => [...prev, newRipple])

      // 애니메이션 완료 후 리플 제거
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }, [enableRipple])

    // 터치 시작 처리
    const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
      touchStartTime.current = Date.now()
      setIsPressed(true)
      
      // 리플 효과 생성
      createRipple(event)
      
      // 햅틱 피드백 트리거
      triggerHapticFeedback()
      
      // 터치 사운드 재생
      playTouchSound()
      
      onTouchStart?.(event)
    }, [createRipple, triggerHapticFeedback, playTouchSound, onTouchStart])

    // 터치 끝 처리
    const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(false)
      onTouchEnd?.(event)
    }, [onTouchEnd])

    // 클릭 처리 (지연 적용)
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (touchDelay > 0) {
        setTimeout(() => {
          onClick?.(event)
        }, touchDelay)
      } else {
        onClick?.(event)
      }
    }, [onClick, touchDelay])

    // 마우스 이벤트에서도 리플 효과 적용 (데스크톱)
    const handleMouseDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event)
    }, [createRipple])

    return (
      <Button
        ref={(node) => {
          if (buttonRef.current !== node) {
            buttonRef.current = node
          }
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={cn(
          // 기본 터치 최적화
          "touch-optimized smooth-touch",
          // 최소 터치 타겟 크기 (WCAG 2.1 AA 준수)
          minTouchTarget && "min-touch-target",
          // 터치 상태 시각적 피드백
          isPressed && "scale-95 brightness-90",
          // 성능 최적화
          "gpu-accelerated will-change-transform",
          // 리플 효과를 위한 상대 위치
          enableRipple && "relative overflow-hidden",
          className
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {/* 리플 효과 렌더링 */}
        {enableRipple && ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-current opacity-30 ripple-effect pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              transform: 'scale(0)',
              animation: 'ripple-animation 0.6s ease-out forwards'
            }}
          />
        ))}
        
        {children}
      </Button>
    )
  }
)

OptimizedTouchButton.displayName = "OptimizedTouchButton"

export { OptimizedTouchButton }
export type { OptimizedTouchButtonProps }

/**
 * 사용 예시:
 * 
 * // 기본 사용법
 * <OptimizedTouchButton onClick={handleClick}>
 *   전송
 * </OptimizedTouchButton>
 * 
 * // 햅틱 피드백 및 리플 효과 비활성화
 * <OptimizedTouchButton 
 *   enableHaptics={false} 
 *   enableRipple={false}
 *   onClick={handleClick}
 * >
 *   조용한 버튼
 * </OptimizedTouchButton>
 * 
 * // 지연 클릭 (실수 터치 방지)
 * <OptimizedTouchButton 
 *   touchDelay={100}
 *   onClick={handleImportantAction}
 * >
 *   중요한 작업
 * </OptimizedTouchButton>
 */