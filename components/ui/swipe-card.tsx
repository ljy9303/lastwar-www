"use client"

import * as React from "react"
import { Card, CardContent, CardProps } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

/**
 * 스와이프 제스처를 지원하는 카드 컴포넌트
 * 
 * 모바일에서 스와이프로 액션을 실행할 수 있으며,
 * 시각적 피드백을 제공합니다.
 */

interface SwipeCardProps extends CardProps {
  /** 왼쪽 스와이프 액션 */
  onSwipeLeft?: () => void
  /** 오른쪽 스와이프 액션 */  
  onSwipeRight?: () => void
  /** 스와이프 임계값 (px) */
  swipeThreshold?: number
  /** 왼쪽 스와이프 액션 라벨 */
  leftActionLabel?: string
  /** 오른쪽 스와이프 액션 라벨 */
  rightActionLabel?: string
  /** 왼쪽 액션 색상 */
  leftActionColor?: 'destructive' | 'warning' | 'success'
  /** 오른쪽 액션 색상 */
  rightActionColor?: 'destructive' | 'warning' | 'success'
}

const actionColors = {
  destructive: 'bg-red-500/20 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  success: 'bg-green-500/20 text-green-700 dark:text-green-300'
}

export const SwipeCard = React.forwardRef<HTMLDivElement, SwipeCardProps>(
  ({
    children,
    className,
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold = 100,
    leftActionLabel = "삭제",
    rightActionLabel = "편집",
    leftActionColor = 'destructive',
    rightActionColor = 'success',
    ...props
  }, ref) => {
    const isMobile = useMobile()
    const [dragX, setDragX] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const startX = React.useRef(0)
    const currentX = React.useRef(0)

    // 터치 이벤트 핸들러
    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      if (!isMobile) return
      
      setIsDragging(true)
      startX.current = e.touches[0].clientX
      currentX.current = e.touches[0].clientX
    }, [isMobile])

    const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
      if (!isDragging) return

      currentX.current = e.touches[0].clientX
      const deltaX = currentX.current - startX.current
      
      // 저항 효과 (스와이프 거리에 따라 점점 어려워짐)
      const resistance = Math.abs(deltaX) > swipeThreshold ? 0.5 : 1
      setDragX(deltaX * resistance)
    }, [isDragging, swipeThreshold])

    const handleTouchEnd = React.useCallback(() => {
      if (!isDragging) return

      const deltaX = currentX.current - startX.current
      
      // 스와이프 판정
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      setIsDragging(false)
      setDragX(0)
    }, [isDragging, swipeThreshold, onSwipeLeft, onSwipeRight])

    // 마우스 이벤트 핸들러 (테스트용)
    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      if (isMobile) return // 모바일에서는 터치 이벤트만 사용
      
      setIsDragging(true)
      startX.current = e.clientX
      currentX.current = e.clientX
    }, [isMobile])

    const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
      if (!isDragging || isMobile) return

      currentX.current = e.clientX
      const deltaX = currentX.current - startX.current
      const resistance = Math.abs(deltaX) > swipeThreshold ? 0.5 : 1
      setDragX(deltaX * resistance)
    }, [isDragging, isMobile, swipeThreshold])

    const handleMouseUp = React.useCallback(() => {
      if (isMobile) return
      handleTouchEnd()
    }, [isMobile, handleTouchEnd])

    // 스와이프 인디케이터 opacity 계산
    const leftOpacity = Math.max(0, Math.min(1, -dragX / swipeThreshold))
    const rightOpacity = Math.max(0, Math.min(1, dragX / swipeThreshold))

    return (
      <div className="relative overflow-hidden">
        {/* 왼쪽 액션 인디케이터 */}
        {onSwipeLeft && (
          <div 
            className={cn(
              "absolute inset-y-0 left-0 flex items-center justify-end px-4 rounded-l-lg",
              actionColors[leftActionColor]
            )}
            style={{ 
              opacity: leftOpacity,
              width: Math.min(100, Math.abs(dragX))
            }}
          >
            <span className="font-medium text-sm">
              {leftActionLabel}
            </span>
          </div>
        )}

        {/* 오른쪽 액션 인디케이터 */}
        {onSwipeRight && (
          <div 
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-start px-4 rounded-r-lg",
              actionColors[rightActionColor]
            )}
            style={{ 
              opacity: rightOpacity,
              width: Math.min(100, Math.abs(dragX))
            }}
          >
            <span className="font-medium text-sm">
              {rightActionLabel}
            </span>
          </div>
        )}

        {/* 메인 카드 */}
        <Card
          ref={ref}
          className={cn(
            "transition-transform duration-100 ease-out",
            isDragging && "transition-none",
            (onSwipeLeft || onSwipeRight) && isMobile && "cursor-grab active:cursor-grabbing",
            className
          )}
          style={{
            transform: `translateX(${dragX}px)`
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          {...props}
        >
          {children}
        </Card>

        {/* 스와이프 힌트 (첫 사용자용) */}
        {isMobile && (onSwipeLeft || onSwipeRight) && !isDragging && (
          <div className="absolute bottom-1 right-2 opacity-30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              ←→ <span>스와이프</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

SwipeCard.displayName = "SwipeCard"