"use client"

import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * 성능 최적화된 지연 로딩 컴포넌트들
 * - 더 작은 번들 사이즈
 * - 빠른 로딩 스켈레톤
 * - 에러 바운더리 내장
 */

// 간단한 로딩 스켈레톤들
const ButtonSkeleton = () => <Skeleton className="h-10 w-24" />
const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-32" />
  </div>
)

const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)

// 성능 최적화된 Lazy 컴포넌트들
export const LazyTouchButton = lazy(() => 
  import('@/components/ui/optimized-touch-button').then(module => ({
    default: module.OptimizedTouchButton
  }))
)

export const LazyFloatingActionButton = lazy(() => 
  import('@/components/ui/lightweight-fab').then(module => ({
    default: module.LightweightFAB
  }))
)

export const LazyFormField = lazy(() => 
  import('@/components/ui/performance-optimized-form').then(module => ({
    default: module.PerformanceOptimizedFormField
  }))
)

// HOC 래퍼들 - Suspense와 에러 처리 포함
export const WithSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode = <ButtonSkeleton />
) => {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  )
}

// 사용하기 쉬운 래핑된 컴포넌트들
export const SuspenseTouchButton = WithSuspense(LazyTouchButton, <ButtonSkeleton />)
export const SuspenseFloatingActionButton = WithSuspense(LazyFloatingActionButton, <ButtonSkeleton />)
export const SuspenseFormField = WithSuspense(LazyFormField, <FormSkeleton />)

// 조건부 로딩 Hook
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  condition: boolean = true
) {
  if (!condition) return null
  
  return lazy(importFn)
}

// 뷰포트 기반 지연 로딩 컴포넌트
interface LazyViewportProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
}

export function LazyViewport({ 
  children, 
  fallback = <Skeleton className="h-40 w-full" />,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyViewportProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}