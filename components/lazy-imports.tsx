"use client"

import { lazy, Suspense } from 'react'
import { TableSkeleton } from '@/components/ui/table-skeleton'

/**
 * 무거운 컴포넌트들의 지연 로딩
 * 
 * 번들 크기 최적화를 위해 큰 컴포넌트들을 동적으로 로드합니다.
 */

// TipTap 에디터 (약 500KB)
export const LazyTipTapEditor = lazy(() => 
  import('@/components/board/board-post-form').then(module => ({
    default: module.BoardPostForm
  }))
)

// Chart 컴포넌트 (Recharts - 약 300KB)  
export const LazyChart = lazy(() =>
  import('recharts').then(module => ({
    default: module.ResponsiveContainer
  }))
)

// Canvas Confetti (약 100KB)
export const LazyConfetti = lazy(() =>
  import('canvas-confetti').then(module => ({
    default: module.default
  }))
)

// Framer Motion 컴포넌트들 (약 200KB)
export const LazyMotionDiv = lazy(() =>
  import('framer-motion').then(module => ({
    default: module.motion.div
  }))
)

// React Markdown 에디터 (약 400KB)
export const LazyMarkdownEditor = lazy(() =>
  import('@uiw/react-md-editor').then(module => ({
    default: module.default
  }))
)

/**
 * 지연 로딩 래퍼 컴포넌트들
 */

interface LazyComponentWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazyTipTapWrapper({ children, fallback, className }: LazyComponentWrapperProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className={className}>
            <div className="animate-pulse bg-gray-200 rounded-lg h-64 w-full" />
            <div className="flex gap-2 mt-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        )
      }
    >
      <LazyTipTapEditor />
    </Suspense>
  )
}

export function LazyChartWrapper({ children, fallback, className }: LazyComponentWrapperProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className={className}>
            <div className="animate-pulse bg-gray-200 rounded-lg h-80 w-full flex items-center justify-center">
              <div className="text-gray-500">차트 로딩 중...</div>
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

export function LazyMarkdownWrapper({ children, fallback, className }: LazyComponentWrapperProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className={className}>
            <div className="border rounded-lg">
              <div className="border-b p-2 bg-gray-50">
                <div className="flex gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="animate-pulse bg-gray-200 rounded h-40 w-full" />
              </div>
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

/**
 * 조건부 지연 로딩 Hook
 */
export function useLazyComponent<T>(
  importFunction: () => Promise<{ default: T }>,
  condition: boolean = true
) {
  const [component, setComponent] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!condition || component) return

    setLoading(true)
    importFunction()
      .then(module => {
        setComponent(module.default)
      })
      .catch(err => {
        setError(err)
        console.error('컴포넌트 지연 로딩 실패:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [condition, component, importFunction])

  return { component, loading, error }
}

/**
 * 인터섹션 기반 지연 로딩
 */
export function useIntersectionLazyLoad<T>(
  importFunction: () => Promise<{ default: T }>,
  options?: IntersectionObserverInit
) {
  const [component, setComponent] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isIntersecting, options])

  useEffect(() => {
    if (!isIntersecting || component || loading) return

    setLoading(true)
    importFunction()
      .then(module => {
        setComponent(module.default)
      })
      .catch(err => {
        console.error('인터섹션 기반 지연 로딩 실패:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isIntersecting, component, loading, importFunction])

  return { ref, component, loading, isIntersecting }
}

import { useState, useEffect, useRef } from 'react'