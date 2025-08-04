"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const touchButtonVariants = cva(
  // Base styles - 애니메이션 최소화, CSS transforms 대신 opacity/scale만 사용
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none touch-manipulation",
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

export interface OptimizedTouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  ariaLabel?: string
  // 성능 최적화를 위해 복잡한 애니메이션 제거
  disableAnimations?: boolean
}

const OptimizedTouchButton = React.forwardRef<HTMLButtonElement, OptimizedTouchButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchSize,
    asChild = false, 
    loading = false,
    loadingText = "처리 중...",
    ariaLabel,
    children,
    onClick,
    disabled,
    disableAnimations = false,
    ...props 
  }, ref) => {
    const isMobile = useMobile()
    
    // 터치 사이즈를 모바일에서 자동 조정
    const effectiveTouchSize = React.useMemo(() => {
      if (!isMobile) return touchSize
      return touchSize === "default" ? "large" : touchSize
    }, [isMobile, touchSize])

    // 햅틱 피드백 최적화 - 디바운스 적용
    const triggerHapticFeedback = React.useCallback(() => {
      if (disabled || loading) return
      
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(8) // 더 짧은 진동으로 성능 개선
        } catch (e) {
          // 진동 실패 시 무시
        }
      }
    }, [disabled, loading])

    // 클릭 핸들러 최적화
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return
      
      triggerHapticFeedback()
      onClick?.(event)
    }, [disabled, loading, triggerHapticFeedback, onClick])

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(
          touchButtonVariants({ 
            variant, 
            size, 
            touchSize: effectiveTouchSize, 
            className 
          }),
          // CSS 애니메이션 최적화 - will-change 제거하여 compositing layer 생성 방지
          !disableAnimations && "transition-colors duration-150",
          loading && "cursor-wait"
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-busy={loading}
        // 터치 최적화
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        {...props}
      >
        {/* 로딩 상태 */}
        {loading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
          </>
        )}

        {/* 버튼 내용 - 불필요한 wrapper 제거 */}
        {loading ? loadingText : children}
      </Comp>
    )
  }
)

OptimizedTouchButton.displayName = "OptimizedTouchButton"

export { OptimizedTouchButton, touchButtonVariants }