"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * 반응형 컨테이너 시스템
 * 
 * 디바이스별로 최적화된 레이아웃을 제공합니다.
 */

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 모바일 전용 클래스명 */
  mobileClassName?: string
  /** 태블릿 전용 클래스명 */  
  tabletClassName?: string
  /** 데스크톱 전용 클래스명 */
  desktopClassName?: string
  /** 패딩 자동 조정 */
  autoPadding?: boolean
  /** 최대 너비 제한 */
  maxWidth?: 'full' | 'container' | 'prose' | 'screen-sm' | 'screen-md' | 'screen-lg'
}

const maxWidthStyles = {
  full: 'max-w-full',
  container: 'max-w-7xl',
  prose: 'max-w-3xl',
  'screen-sm': 'max-w-screen-sm',
  'screen-md': 'max-w-screen-md', 
  'screen-lg': 'max-w-screen-lg'
}

export const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({
    children,
    className,
    mobileClassName,
    tabletClassName,
    desktopClassName,
    autoPadding = true,
    maxWidth = 'container',
    ...props
  }, ref) => {
    const isMobile = useMobile(768)
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    return (
      <div
        ref={ref}
        className={cn(
          // 기본 컨테이너 스타일
          "mx-auto w-full",
          maxWidthStyles[maxWidth],
          
          // 자동 패딩
          autoPadding && [
            isMobile && "px-4 py-6",
            isTablet && "px-6 py-8", 
            isDesktop && "px-8 py-12"
          ],
          
          // 디바이스별 커스텀 클래스
          isMobile && mobileClassName,
          isTablet && tabletClassName,
          isDesktop && desktopClassName,
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = "ResponsiveContainer"

/**
 * 반응형 그리드 시스템
 */
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 모바일 컬럼 수 */
  mobileCols?: number
  /** 태블릿 컬럼 수 */
  tabletCols?: number  
  /** 데스크톱 컬럼 수 */
  desktopCols?: number
  /** 간격 크기 */
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  /** 아이템 최소 너비 */
  minItemWidth?: string
}

const gridColsStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-2', 
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6'
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6', 
  xl: 'gap-8'
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({
    children,
    className,
    mobileCols = 1,
    tabletCols = 2,
    desktopCols = 3,
    gap = 'md',
    minItemWidth,
    ...props
  }, ref) => {
    const isMobile = useMobile(768)
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)")

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gapStyles[gap],
          
          // 반응형 컬럼
          isMobile && gridColsStyles[mobileCols as keyof typeof gridColsStyles],
          isTablet && `md:${gridColsStyles[tabletCols as keyof typeof gridColsStyles]}`,
          `lg:${gridColsStyles[desktopCols as keyof typeof gridColsStyles]}`,
          
          // 최소 너비 기반 자동 컬럼 (옵션)
          minItemWidth && `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`,
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveGrid.displayName = "ResponsiveGrid"

/**
 * 반응형 스택 레이아웃
 */
interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 모바일에서 스택 방향 */
  mobileDirection?: 'vertical' | 'horizontal'
  /** 태블릿 이상에서 레이아웃 */
  largeDirection?: 'vertical' | 'horizontal'
  /** 정렬 방식 */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /** 간격 */
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export const ResponsiveStack = React.forwardRef<HTMLDivElement, ResponsiveStackProps>(
  ({
    children,
    className,
    mobileDirection = 'vertical',
    largeDirection = 'horizontal', 
    align = 'start',
    gap = 'md',
    ...props
  }, ref) => {
    const isMobile = useMobile(768)

    const alignStyles = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          gapStyles[gap],
          alignStyles[align],
          
          // 모바일 방향
          isMobile && mobileDirection === 'vertical' && "flex-col",
          isMobile && mobileDirection === 'horizontal' && "flex-row",
          
          // 큰 화면 방향
          !isMobile && largeDirection === 'vertical' && "md:flex-col",
          !isMobile && largeDirection === 'horizontal' && "md:flex-row",
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveStack.displayName = "ResponsiveStack"