/**
 * 가상 스크롤 훅 - DOM 노드 최적화
 * 대량의 메시지를 효율적으로 렌더링
 */

import { useMemo, useState, useEffect, useCallback } from 'react'

interface VirtualScrollOptions {
  itemHeight: number // 메시지 평균 높이
  containerHeight: number // 컨테이너 높이
  overscan: number // 추가로 렌더링할 아이템 수
  threshold: number // 가상화 시작 임계점
}

interface VirtualItem {
  index: number
  start: number
  end: number
}

interface UseVirtualScrollReturn<T> {
  virtualItems: VirtualItem[]
  totalHeight: number
  shouldVirtualize: boolean
  scrollToIndex: (index: number) => void
  getVisibleRange: () => { start: number; end: number }
}

export function useVirtualScroll<T>(
  items: T[],
  scrollTop: number,
  options: VirtualScrollOptions
): UseVirtualScrollReturn<T> {
  const { itemHeight, containerHeight, overscan, threshold } = options
  
  // 가상화 필요 여부 판단
  const shouldVirtualize = useMemo(() => {
    return items.length > threshold
  }, [items.length, threshold])

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    return items.length * itemHeight
  }, [items.length, itemHeight])

  // 보이는 범위 계산
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length - 1 }
    }

    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      Math.ceil((scrollTop + containerHeight) / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length, shouldVirtualize])

  // 가상 아이템 생성
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = []
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight
      })
    }
    
    return items
  }, [visibleRange, itemHeight])

  const scrollToIndex = useCallback((index: number) => {
    const element = document.querySelector('.infinite-scroll-container')
    if (element) {
      element.scrollTop = index * itemHeight
    }
  }, [itemHeight])

  const getVisibleRange = useCallback(() => visibleRange, [visibleRange])

  return {
    virtualItems,
    totalHeight,
    shouldVirtualize,
    scrollToIndex,
    getVisibleRange
  }
}