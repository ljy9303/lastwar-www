"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const fabVariants = cva(
  "fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 font-medium touch-manipulation select-none",
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
        xl: "h-20 w-20 text-xl",
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

const subActionVariants = cva(
  "absolute flex items-center justify-center rounded-full shadow-md transition-all duration-200 font-medium touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
      },
      size: {
        default: "h-12 w-12 text-sm",
        sm: "h-10 w-10 text-xs", 
        lg: "h-14 w-14 text-base",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface SubAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: VariantProps<typeof subActionVariants>["variant"]
}

export interface FloatingActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof fabVariants> {
  /** 서브 액션 목록 */
  subActions?: SubAction[]
  /** 메인 아이콘 (기본값: Plus) */
  icon?: React.ReactNode
  /** 확장된 상태일 때 아이콘 (기본값: X) */
  expandedIcon?: React.ReactNode
  /** 라벨 텍스트 */
  label?: string
  /** 라벨 위치 */
  labelPosition?: "left" | "right" | "top" | "bottom"
  /** 확장 애니메이션 방향 */
  expandDirection?: "up" | "down" | "left" | "right"
  /** 모바일에서만 표시 */
  mobileOnly?: boolean
  /** 스크롤 시 숨김 */
  hideOnScroll?: boolean
  /** 진동 피드백 */
  hapticFeedback?: boolean
}

const expandDirectionOffsets = {
  up: (index: number) => ({ x: 0, y: -(index + 1) * 60 }),
  down: (index: number) => ({ x: 0, y: (index + 1) * 60 }),
  left: (index: number) => ({ x: -(index + 1) * 60, y: 0 }),
  right: (index: number) => ({ x: (index + 1) * 60, y: 0 }),
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({
    className,
    variant,
    size,
    position,
    subActions = [],
    icon = <Plus className="h-5 w-5" />,
    expandedIcon = <X className="h-5 w-5" />,
    label,
    labelPosition = "left",
    expandDirection = "up",
    mobileOnly = false,
    hideOnScroll = false,
    hapticFeedback = true,
    onClick,
    children,
    ...props
  }, ref) => {
    const isMobile = useMobile()
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const [scrollY, setScrollY] = React.useState(0)
    const lastScrollY = React.useRef(0)

    // 스크롤 이벤트 처리
    React.useEffect(() => {
      if (!hideOnScroll) return

      const handleScroll = () => {
        const currentScrollY = window.scrollY
        setScrollY(currentScrollY)
        
        // 스크롤 방향에 따라 버튼 표시/숨김
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // 아래로 스크롤: 숨김
          setIsVisible(false)
          setIsExpanded(false)
        } else {
          // 위로 스크롤: 표시
          setIsVisible(true)
        }
        
        lastScrollY.current = currentScrollY
      }

      window.addEventListener("scroll", handleScroll, { passive: true })
      return () => window.removeEventListener("scroll", handleScroll)
    }, [hideOnScroll])

    // 햅틱 피드백
    const triggerHapticFeedback = React.useCallback(() => {
      if (!hapticFeedback) return
      
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10)
        } catch (e) {
          // 진동 실패 시 무시
        }
      }
    }, [hapticFeedback])

    // 메인 버튼 클릭
    const handleMainClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      
      triggerHapticFeedback()
      
      if (subActions.length > 0) {
        setIsExpanded(prev => !prev)
      } else {
        onClick?.(event)
      }
    }, [subActions.length, triggerHapticFeedback, onClick])

    // 서브 액션 클릭
    const handleSubActionClick = React.useCallback((action: SubAction) => {
      triggerHapticFeedback()
      setIsExpanded(false)
      action.onClick()
    }, [triggerHapticFeedback])

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
        {/* 백드롭 (확장 시에만 표시) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
            />
          )}
        </AnimatePresence>

        {/* 메인 FAB */}
        <motion.button
          ref={ref}
          className={cn(fabVariants({ variant, size, position }), className)}
          onClick={handleMainClick}
          animate={{
            scale: isVisible ? 1 : 0,
            rotate: isExpanded ? 45 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          whileTap={{ scale: 0.95 }}
          {...props}
        >
          {/* 아이콘 전환 애니메이션 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isExpanded ? "expanded" : "collapsed"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isExpanded ? expandedIcon : icon}
            </motion.div>
          </AnimatePresence>

          {/* 라벨 (데스크톱에서만 표시) */}
          {label && !isMobile && (
            <motion.span
              className={cn(
                "absolute text-sm font-medium bg-black/80 text-white px-3 py-1 rounded-md whitespace-nowrap pointer-events-none",
                {
                  "right-full mr-3": labelPosition === "left",
                  "left-full ml-3": labelPosition === "right", 
                  "bottom-full mb-3": labelPosition === "top",
                  "top-full mt-3": labelPosition === "bottom",
                }
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {label}
            </motion.span>
          )}
        </motion.button>

        {/* 서브 액션 버튼들 */}
        <AnimatePresence>
          {isExpanded && subActions.map((action, index) => {
            const offset = expandDirectionOffsets[expandDirection](index)
            
            return (
              <motion.button
                key={action.id}
                className={cn(
                  subActionVariants({ 
                    variant: action.variant || "default", 
                    size: size === "xl" ? "lg" : size === "sm" ? "sm" : "default" 
                  }),
                  fabVariants({ position })
                )}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
                initial={{ 
                  scale: 0, 
                  opacity: 0,
                  x: offset.x,
                  y: offset.y,
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: offset.x,
                  y: offset.y,
                }}
                exit={{ 
                  scale: 0, 
                  opacity: 0,
                  x: 0,
                  y: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.05,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSubActionClick(action)}
                aria-label={action.label}
              >
                {action.icon}
                
                {/* 서브 액션 라벨 (데스크톱에서만) */}
                {!isMobile && (
                  <span className={cn(
                    "absolute text-xs font-medium bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10",
                    {
                      "right-full mr-2": labelPosition === "left" || expandDirection === "left",
                      "left-full ml-2": labelPosition === "right" || expandDirection === "right",
                      "bottom-full mb-2": expandDirection === "up",
                      "top-full mt-2": expandDirection === "down",
                    }
                  )}>
                    {action.label}
                  </span>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </>
    )
  }
)

FloatingActionButton.displayName = "FloatingActionButton"

export { fabVariants, subActionVariants }