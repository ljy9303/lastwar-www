"use client"

import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { cn } from "@/lib/utils"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Eye } from "lucide-react"

interface RosterMember {
  id: number
  name: string
  level: number
  power: number
  grade: string
  status: 'active' | 'inactive'
  lastActive?: string
  [key: string]: any
}

interface VirtualizedRosterTableProps {
  data: RosterMember[]
  height?: number
  itemHeight?: number
  onEdit?: (member: RosterMember) => void
  onView?: (member: RosterMember) => void
  className?: string
  mobileOptimized?: boolean
}

interface RowData {
  items: RosterMember[]
  onEdit?: (member: RosterMember) => void
  onView?: (member: RosterMember) => void
  mobileOptimized: boolean
}

// 개별 행 컴포넌트 (React.memo로 최적화)
const TableRow = React.memo<{
  index: number
  style: React.CSSProperties
  data: RowData
}>(({ index, style, data }) => {
  const { items, onEdit, onView, mobileOptimized } = data
  const member = items[index]

  const formatPower = useCallback((power: number): string => {
    if (power === 0) return "0"
    if (power < 1000) return power.toString()
    if (power >= 1000000) return `${(power / 1000000).toFixed(1)}M`
    if (power >= 1000) return `${(power / 1000).toFixed(1)}K`
    return power.toString()
  }, [])

  const getGradeBadgeVariant = useCallback((grade: string) => {
    switch (grade.toUpperCase()) {
      case 'R5': return 'destructive'
      case 'R4': return 'default'
      case 'R3': return 'secondary'
      case 'R2': return 'outline'
      case 'R1': return 'secondary'
      default: return 'outline'
    }
  }, [])

  const handleEdit = useCallback(() => {
    onEdit?.(member)
  }, [onEdit, member])

  const handleView = useCallback(() => {
    onView?.(member)
  }, [onView, member])

  if (mobileOptimized) {
    // 모바일 최적화 레이아웃
    return (
      <div
        style={style}
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-border bg-background hover:bg-muted/50 transition-colors",
          index % 2 === 0 && "bg-muted/20"
        )}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{member.name}</span>
            <Badge 
              variant={getGradeBadgeVariant(member.grade)} 
              className="text-xs"
            >
              {member.grade}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Lv.{member.level}</span>
            <span>{formatPower(member.power)}</span>
            <span className={cn(
              "capitalize",
              member.status === 'active' ? "text-green-600" : "text-gray-500"
            )}>
              {member.status}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <OptimizedTouchButton
            variant="ghost"
            size="mobile-icon"
            onClick={handleView}
            className="h-10 w-10"
          >
            <Eye className="h-4 w-4" />
          </OptimizedTouchButton>
          <OptimizedTouchButton
            variant="ghost"
            size="mobile-icon"
            onClick={handleEdit}
            className="h-10 w-10"
          >
            <Pencil className="h-4 w-4" />
          </OptimizedTouchButton>
        </div>
      </div>
    )
  }

  // 데스크톱 테이블 레이아웃
  return (
    <div
      style={style}
      className={cn(
        "grid grid-cols-6 gap-4 items-center px-6 py-3 border-b border-border bg-background hover:bg-muted/50 transition-colors",
        index % 2 === 0 && "bg-muted/20"
      )}
    >
      <div className="font-medium">{member.name}</div>
      <div className="text-sm text-muted-foreground">Lv.{member.level}</div>
      <div className="text-sm">{formatPower(member.power)}</div>
      <div>
        <Badge variant={getGradeBadgeVariant(member.grade)}>
          {member.grade}
        </Badge>
      </div>
      <div className={cn(
        "text-sm capitalize",
        member.status === 'active' ? "text-green-600" : "text-gray-500"
      )}>
        {member.status}
      </div>
      <div className="flex gap-2 justify-end">
        <OptimizedTouchButton
          variant="ghost"
          size="icon"
          onClick={handleView}
        >
          <Eye className="h-4 w-4" />
        </OptimizedTouchButton>
        <OptimizedTouchButton
          variant="ghost"
          size="icon"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </OptimizedTouchButton>
      </div>
    </div>
  )
})

TableRow.displayName = "TableRow"

// 테이블 헤더 컴포넌트
const TableHeader = React.memo<{ mobileOptimized: boolean }>(({ mobileOptimized }) => {
  if (mobileOptimized) {
    return (
      <div className="px-4 py-3 border-b-2 border-border bg-muted/50 sticky top-0 z-10">
        <span className="font-semibold text-sm">멤버 목록</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b-2 border-border bg-muted/50 sticky top-0 z-10">
      <div className="font-semibold text-sm">이름</div>
      <div className="font-semibold text-sm">레벨</div>
      <div className="font-semibold text-sm">전투력</div>
      <div className="font-semibold text-sm">등급</div>
      <div className="font-semibold text-sm">상태</div>
      <div className="font-semibold text-sm text-right">액션</div>
    </div>
  )
})

TableHeader.displayName = "TableHeader"

// 메인 가상화 테이블 컴포넌트
export const VirtualizedRosterTable = React.memo<VirtualizedRosterTableProps>(({
  data,
  height = 400,
  itemHeight,
  onEdit,
  onView,
  className,
  mobileOptimized = false
}) => {
  // 모바일/데스크톱에 따른 기본 행 높이 설정
  const defaultItemHeight = useMemo(() => {
    if (itemHeight) return itemHeight
    return mobileOptimized ? 68 : 60 // 모바일에서 더 높은 터치 영역
  }, [itemHeight, mobileOptimized])

  // 가상화를 위한 데이터 준비
  const rowData: RowData = useMemo(() => ({
    items: data,
    onEdit,
    onView,
    mobileOptimized
  }), [data, onEdit, onView, mobileOptimized])

  // 빈 상태 처리
  if (!data || data.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <TableHeader mobileOptimized={mobileOptimized} />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <TableHeader mobileOptimized={mobileOptimized} />
      <List
        height={height}
        width="100%"
        itemCount={data.length}
        itemSize={defaultItemHeight}
        itemData={rowData}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        overscanCount={5} // 부드러운 스크롤을 위한 오버스캔
      >
        {TableRow}
      </List>
    </div>
  )
})

VirtualizedRosterTable.displayName = "VirtualizedRosterTable"

// 무한 스크롤을 지원하는 가상화 테이블
interface InfiniteVirtualizedRosterTableProps extends VirtualizedRosterTableProps {
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
}

export const InfiniteVirtualizedRosterTable = React.memo<InfiniteVirtualizedRosterTableProps>(({
  data,
  height = 400,
  itemHeight,
  onEdit,
  onView,
  className,
  mobileOptimized = false,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage
}) => {
  const defaultItemHeight = useMemo(() => {
    if (itemHeight) return itemHeight
    return mobileOptimized ? 68 : 60
  }, [itemHeight, mobileOptimized])

  // 로딩 항목 포함한 총 아이템 수
  const itemCount = hasNextPage ? data.length + 1 : data.length
  
  // 아이템이 로드되었는지 확인
  const isItemLoaded = useCallback((index: number) => {
    return index < data.length
  }, [data.length])

  // 로딩 상태 행 렌더링
  const LoadingRow = React.memo<{
    index: number
    style: React.CSSProperties
  }>(({ style }) => (
    <div
      style={style}
      className="flex items-center justify-center py-4 text-muted-foreground"
    >
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="ml-2">로딩 중...</span>
    </div>
  ))

  LoadingRow.displayName = "LoadingRow"

  // 행 렌더링 함수
  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return <LoadingRow index={index} style={style} />
    }

    return (
      <TableRow
        index={index}
        style={style}
        data={{
          items: data,
          onEdit,
          onView,
          mobileOptimized
        }}
      />
    )
  }, [data, onEdit, onView, mobileOptimized, isItemLoaded])

  if (!data || data.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <TableHeader mobileOptimized={mobileOptimized} />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <TableHeader mobileOptimized={mobileOptimized} />
      <List
        height={height}
        width="100%"
        itemCount={itemCount}
        itemSize={defaultItemHeight}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        overscanCount={5}
        onItemsRendered={({ visibleStopIndex }) => {
          // 마지막 항목에 가까워지면 다음 페이지 로드
          if (
            hasNextPage &&
            !isNextPageLoading &&
            visibleStopIndex >= data.length - 10 &&
            loadNextPage
          ) {
            loadNextPage()
          }
        }}
      >
        {renderRow}
      </List>
    </div>
  )
})

InfiniteVirtualizedRosterTable.displayName = "InfiniteVirtualizedRosterTable"