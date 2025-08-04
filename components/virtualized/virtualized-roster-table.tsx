"use client"

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface Roster {
  userSeq: number
  userName: string
  userLevel: number
  userPower: number
  userGrade?: string
  intentType: string
}

interface VirtualizedRosterTableProps {
  rosters: Roster[]
  preferenceOptions: Array<{ value: string; label: string }>
  pendingChanges: Record<number, string>
  onPreferenceChange: (userSeq: number, intentType: string) => void
  onEditClick: (roster: Roster) => void
  formatPower: (power: number) => string
  height?: number
  itemHeight?: number
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: {
    rosters: Roster[]
    preferenceOptions: Array<{ value: string; label: string }>
    pendingChanges: Record<number, string>
    onPreferenceChange: (userSeq: number, intentType: string) => void
    onEditClick: (roster: Roster) => void
    formatPower: (power: number) => string
    isMobile: boolean
  }
}

// 메모이제이션된 행 컴포넌트
const RosterRow = React.memo<RowProps>(({ index, style, data }) => {
  const { 
    rosters, 
    preferenceOptions, 
    pendingChanges, 
    onPreferenceChange, 
    onEditClick, 
    formatPower,
    isMobile 
  } = data
  
  const roster = rosters[index]
  if (!roster) return null

  return (
    <div style={style} className="border-b">
      <div className="flex items-center h-full px-4">
        {/* 닉네임 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium">{roster.userName}</div>
          {isMobile && (
            <div className="text-xs text-muted-foreground">
              Lv.{roster.userLevel} | {formatPower(roster.userPower)}
            </div>
          )}
        </div>

        {/* 본부 레벨 (데스크톱만) */}
        {!isMobile && (
          <div className="w-20 text-center">{roster.userLevel}</div>
        )}

        {/* 전투력 (데스크톱만) */}
        {!isMobile && (
          <div className="w-24 text-center">{formatPower(roster.userPower)}</div>
        )}

        {/* 유저 등급 (데스크톱만) */}
        {!isMobile && (
          <div className="w-20 text-center">{roster.userGrade || '-'}</div>
        )}

        {/* 선호 팀 */}
        <div className={cn("flex-1 min-w-0 mx-4", isMobile ? "max-w-[120px]" : "max-w-[200px]")}>
          {isMobile ? (
            <Select
              value={pendingChanges[roster.userSeq] || roster.intentType}
              onValueChange={(value) => onPreferenceChange(roster.userSeq, value)}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="선호팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {preferenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {preferenceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    (pendingChanges[roster.userSeq] || roster.intentType) === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80",
                  )}
                  onClick={() => onPreferenceChange(roster.userSeq, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 관리 */}
        <div className="w-16 flex justify-center">
          <OptimizedTouchButton 
            variant="ghost" 
            size="icon" 
            onClick={() => onEditClick(roster)}
            ariaLabel={`${roster.userName} 정보 수정`}
            touchSize={isMobile ? "large" : "default"}
            showRipple={false} // 가상화된 리스트에서는 리플 효과 비활성화
          >
            <Pencil className="h-4 w-4" />
          </OptimizedTouchButton>
        </div>
      </div>
    </div>
  )
})

RosterRow.displayName = "RosterRow"

export function VirtualizedRosterTable({
  rosters,
  preferenceOptions,
  pendingChanges,
  onPreferenceChange,
  onEditClick,
  formatPower,
  height = 600,
  itemHeight = 60
}: VirtualizedRosterTableProps) {
  const isMobile = useMobile()
  
  // 가상화를 위한 데이터 준비
  const itemData = useMemo(() => ({
    rosters,
    preferenceOptions,
    pendingChanges,
    onPreferenceChange,
    onEditClick,
    formatPower,
    isMobile
  }), [rosters, preferenceOptions, pendingChanges, onPreferenceChange, onEditClick, formatPower, isMobile])

  // 데이터가 없는 경우
  if (rosters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        사전조사 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      {/* 헤더 (고정) */}
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center">
          <div className="flex-1 font-medium">닉네임</div>
          {!isMobile && (
            <>
              <div className="w-20 text-center font-medium">본부 레벨</div>
              <div className="w-24 text-center font-medium">전투력</div>
              <div className="w-20 text-center font-medium">유저 등급</div>
            </>
          )}
          <div className={cn("flex-1 font-medium mx-4", isMobile ? "max-w-[120px]" : "max-w-[200px]")}>
            선호 팀
          </div>
          <div className="w-16 text-center font-medium">관리</div>
        </div>
      </div>

      {/* 가상화된 목록 */}
      <List
        height={height}
        itemCount={rosters.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {RosterRow}
      </List>
    </div>
  )
}

export default VirtualizedRosterTable