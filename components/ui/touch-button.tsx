"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const touchButtonVariants = cva(
  // Base styles - 모든 버튼의 공통 스타일 + 터치 최적화
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        // 터치 최적화 사이즈 - 최소 44px 보장
        default: "h-10 px-4 py-2 min-h-[44px] min-w-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[44px] min-w-[44px]",
        lg: "h-11 rounded-md px-8 min-h-[48px] min-w-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-8 w-8 min-h-[44px] min-w-[44px]",
        "icon-lg": "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
      touchSize: {
        default: "",
        large: "min-h-[56px] min-w-[56px] text-base px-6",
        xl: "min-h-[64px] min-w-[64px] text-lg px-8",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      touchSize: "default",
    },
  }
)

// 리플 효과를 위한 애니메이션 variants
const rippleVariants = {
  initial: { scale: 0, opacity: 0.8 },
  animate: { 
    scale: 4, 
    opacity: 0,
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    }
  }
}

const buttonVariants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.95,
    transition: { 
      duration: 0.1,
      ease: "easeInOut"
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
}

export interface TouchButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  showRipple?: boolean
  hapticFeedback?: boolean
  ariaLabel?: string
}

interface RippleState {
  id: number
  x: number
  y: number
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchSize,
    asChild = false, 
    loading = false,
    loadingText = "처리 중...",
    showRipple = true,
    hapticFeedback = true,
    ariaLabel,
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const isMobile = useMobile()
    const [ripples, setRipples] = React.useState<RippleState[]>([])
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    
    // ref 병합
    React.useImperativeHandle(ref, () => buttonRef.current!, [])

    // 리플 효과 생성
    const createRipple = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (!showRipple || disabled || loading) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const newRipple: RippleState = {
        id: Date.now(),
        x,
        y
      }

      setRipples(prev => [...prev, newRipple])

      // 리플 애니메이션 완료 후 제거
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }, [showRipple, disabled, loading])

    // 햅틱 피드백 시뮬레이션 (시각적 효과)
    const triggerHapticFeedback = React.useCallback(() => {
      if (!hapticFeedback || disabled || loading) return
      
      // 실제 디바이스에서는 navigator.vibrate(50) 등을 사용할 수 있음
      // 현재는 시각적 피드백으로 대체
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10) // 매우 짧은 진동
        } catch (e) {
          // 진동 실패 시 무시
        }
      }
    }, [hapticFeedback, disabled, loading])

    // 클릭 핸들러
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      createRipple(event)
      triggerHapticFeedback()
      onClick?.(event)
    }, [disabled, loading, createRipple, triggerHapticFeedback, onClick])

    // 터치 사이즈를 모바일에서 자동 조정
    const effectiveTouchSize = React.useMemo(() => {
      if (!isMobile) return touchSize
      return touchSize === "default" ? "large" : touchSize
    }, [isMobile, touchSize])

    const Comp = asChild ? Slot : motion.button

    const motionProps: Partial<HTMLMotionProps<"button">> = asChild ? {} : {
      variants: buttonVariants,
      initial: "initial",
      whileTap: disabled || loading ? undefined : "tap",
      whileHover: disabled || loading ? undefined : "hover",
    }

    return (
      <Comp
        ref={buttonRef}
        className={cn(
          touchButtonVariants({ 
            variant, 
            size, 
            touchSize: effectiveTouchSize, 
            className 
          }),
          "relative overflow-hidden",
          loading && "cursor-wait"
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...motionProps}
        {...props}
      >
        {/* 리플 효과 */}
        {showRipple && (
          <div className="absolute inset-0 pointer-events-none">
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                className="absolute rounded-full bg-current opacity-20"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20,
                }}
                variants={rippleVariants}
                initial="initial"
                animate="animate"
              />
            ))}
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
          </>
        )}

        {/* 버튼 내용 */}
        <span className={cn(
          "relative z-10 flex items-center gap-2",
          loading && "opacity-70"
        )}>
          {loading ? loadingText : children}
        </span>
      </Comp>
    )
  }
)

TouchButton.displayName = "TouchButton"

export { TouchButton, touchButtonVariants }