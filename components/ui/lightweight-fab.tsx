"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const fabVariants = cva(
  "fixed z-50 flex items-center justify-center rounded-full shadow-lg font-medium touch-manipulation select-none transition-transform duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        success: "bg-green-500 text-white hover:bg-green-600 active:bg-green-700",
      },
      size: {
        default: "h-14 w-14 text-base",
        sm: "h-12 w-12 text-sm",
        lg: "h-16 w-16 text-lg",
      },
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6", 
        "bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      position: "bottom-right",
    },
  }
)

interface SimpleSubAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export interface LightweightFABProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof fabVariants> {
  /** 서브 액션 목록 (최대 4개 권장) */
  subActions?: SimpleSubAction[]
  /** 메인 아이콘 */
  icon?: React.ReactNode
  /** 라벨 텍스트 */
  label?: string
  /** 모바일에서만 표시 */
  mobileOnly?: boolean
  /** 스크롤 시 숨김 */
  hideOnScroll?: boolean
}

export const LightweightFAB = React.forwardRef<HTMLButtonElement, LightweightFABProps>(
  ({
    className,
    variant,
    size,
    position,
    subActions = [],
    icon = <Plus className="h-5 w-5" />,
    label,
    mobileOnly = false,
    hideOnScroll = false,
    onClick,
    children,
    ...props
  }, ref) => {
    const isMobile = useMobile()
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const lastScrollY = React.useRef(0)

    // 스크롤 이벤트 처리 (최적화: passive listener 사용)
    React.useEffect(() => {
      if (!hideOnScroll) return

      const handleScroll = () => {
        const currentScrollY = window.scrollY
        
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false)
          setIsExpanded(false)
        } else {
          setIsVisible(true)
        }
        
        lastScrollY.current = currentScrollY
      }

      // RAF throttling으로 성능 최적화
      let ticking = false
      const throttledScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll()
            ticking = false
          })
          ticking = true
        }
      }

      window.addEventListener("scroll", throttledScroll, { passive: true })
      return () => window.removeEventListener("scroll", throttledScroll)
    }, [hideOnScroll])

    // 메인 버튼 클릭
    const handleMainClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      
      // 햅틱 피드백 (가볍게)
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(8)
        } catch (e) {
          // ignore
        }
      }
      
      if (subActions.length > 0) {
        setIsExpanded(prev => !prev)
      } else {
        onClick?.(event)
      }
    }, [subActions.length, onClick])

    // 서브 액션 클릭
    const handleSubActionClick = React.useCallback((action: SimpleSubAction) => {
      setIsExpanded(false)
      action.onClick()
    }, [])

    // 백드롭 클릭으로 닫기
    const handleBackdropClick = React.useCallback(() => {
      setIsExpanded(false)
    }, [])

    // 모바일 전용 옵션 체크
    if (mobileOnly && !isMobile) {
      return null
    }

    return (
      <>
        {/* 간단한 백드롭 (blur 효과 제거하여 성능 개선) */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={handleBackdropClick}
          />
        )}

        {/* 메인 FAB - 복잡한 애니메이션 제거 */}
        <button
          ref={ref}
          className={cn(
            fabVariants({ variant, size, position }), 
            className,
            // 간단한 CSS 전환만 사용
            isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0",
            isExpanded && "rotate-45"
          )}
          onClick={handleMainClick}
          style={{
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            willChange: 'transform, opacity'
          }}
          {...props}
        >
          {isExpanded ? <X className="h-5 w-5" /> : icon}
          
          {/* 라벨 (데스크톱에서만, 간단하게) */}
          {label && !isMobile && (
            <span className="absolute right-full mr-3 text-sm font-medium bg-black/80 text-white px-3 py-1 rounded-md whitespace-nowrap pointer-events-none">
              {label}
            </span>
          )}
        </button>

        {/* 서브 액션 버튼들 - 애니메이션 최소화 */}
        {isExpanded && subActions.map((action, index) => {
          const offset = -(index + 1) * 60 // 위쪽으로만 확장
          
          return (
            <button
              key={action.id}
              className={cn(
                "absolute flex items-center justify-center h-12 w-12 rounded-full shadow-md font-medium touch-manipulation select-none",
                "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200",
                fabVariants({ position })
              )}
              style={{
                transform: `translateY(${offset}px)`,
                transition: 'opacity 0.15s ease',
                opacity: isExpanded ? 1 : 0,
              }}
              onClick={() => handleSubActionClick(action)}
              aria-label={action.label}
            >
              {action.icon}
              
              {/* 서브 액션 라벨 (간단하게) */}
              {!isMobile && (
                <span className="absolute right-full mr-2 text-xs font-medium bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                  {action.label}
                </span>
              )}
            </button>
          )
        })}
      </>
    )
  }
)

LightweightFAB.displayName = "LightweightFAB"

export { fabVariants }