/**
 * 채팅 날짜 구분선 컴포넌트
 * 슬랙 스타일의 날짜 구분선
 */

import React, { memo } from 'react'
import { cn } from '@/lib/utils'

interface DateSeparatorProps {
  label: string
  className?: string
}

/**
 * 날짜 구분선 컴포넌트
 * 슬랙처럼 "오늘", "어제", "7월 23일 수요일" 등으로 표시
 */
const DateSeparator = memo(function DateSeparator({ label, className }: DateSeparatorProps) {
  return (
    <div className={cn(
      "flex items-center my-4 px-3",
      className
    )}>
      {/* 왼쪽 선 */}
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      
      {/* 날짜 라벨 */}
      <div className="px-3 py-1 mx-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {label}
        </span>
      </div>
      
      {/* 오른쪽 선 */}
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </div>
  )
})

// displayName 설정 (React DevTools용)
DateSeparator.displayName = 'DateSeparator'

export { DateSeparator }