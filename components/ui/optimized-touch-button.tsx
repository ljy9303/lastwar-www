"use client"

import React, { useState, useCallback, useRef } from 'react'
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const touchButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // 모바일 최적화 사이즈 (44px 최소 터치 영역)
        "mobile-sm": "h-11 px-4 text-sm md:h-9 md:px-3",
        "mobile-default": "h-12 px-6 text-base md:h-10 md:px-4",
        "mobile-lg": "h-14 px-8 text-lg md:h-11 md:px-8",
        "mobile-icon": "h-11 w-11 md:h-10 md:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface OptimizedTouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  enableRipple?: boolean
  rippleColor?: string
}

interface RippleEffect {
  id: number
  x: number
  y: number
  size: number
}

const OptimizedTouchButton = React.memo(React.forwardRef<
  HTMLButtonElement,
  OptimizedTouchButtonProps
>(({ 
  className, 
  variant, 
  size, 
  enableRipple = true, 
  rippleColor = "rgba(255, 255, 255, 0.3)",
  children,
  onClick,
  onTouchStart,
  onTouchEnd,
  ...props 
}, ref) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const rippleIdRef = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // 리플 효과 생성
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!enableRipple) return
    
    const button = buttonRef.current
    if (!button) return
    
    const rect = button.getBoundingClientRect()
    
    // 터치 이벤트와 마우스 이벤트 모두 처리
    const clientX = 'touches' in event 
      ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX
      : event.clientX
    const clientY = 'touches' in event 
      ? event.touches[0]?.clientY || event.changedTouches[0]?.clientY
      : event.clientY
    
    const x = clientX - rect.left
    const y = clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2
    
    const newRipple: RippleEffect = {
      id: ++rippleIdRef.current,
      x,
      y,
      size
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // 애니메이션 완료 후 리플 제거 (CSS 애니메이션 duration과 맞춤)
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }, [enableRipple])
  
  const handleInteraction = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(event)
    onClick?.(event)
  }, [createRipple, onClick])
  
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    createRipple(event)
    onTouchStart?.(event)
  }, [createRipple, onTouchStart])
  
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    onTouchEnd?.(event)
  }, [onTouchEnd])

  return (
    <button
      className={cn(touchButtonVariants({ variant, size, className }))}
      ref={(node) => {
        buttonRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      onClick={handleInteraction}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {/* 리플 효과 렌더링 */}
      {enableRipple && ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            position: 'absolute',
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            borderRadius: '50%',
            pointerEvents: 'none',
            animation: 'ripple-animation 0.6s linear',
            zIndex: 0
          }}
        />
      ))}
      
      {/* 콘텐츠를 리플 위에 표시 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  )
}))

OptimizedTouchButton.displayName = "OptimizedTouchButton"

export { OptimizedTouchButton, touchButtonVariants }