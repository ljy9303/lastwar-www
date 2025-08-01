"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SwipeCard } from "@/components/ui/swipe-card"
import { TouchButton } from "@/components/ui/touch-button"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { ChevronRight, MoreVertical } from "lucide-react"
import type { User } from "@/types/user"

/**
 * 모바일 최적화 사용자 테이블 컴포넌트
 * 
 * 모바일에서는 카드형 리스트로, 데스크톱에서는 테이블로 표시
 */

interface MobileUserTableProps {
  users: User[]
  onUserClick?: (user: User) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  loading?: boolean
}

/**
 * 전투력 포맷팅 함수
 */
const formatPower = (power: number): string => {
  if (power === 0) return "0"
  if (power < 1) return `${(power * 100).toFixed(0)}만`
  if (power >= 1000) return `${(power / 1000).toFixed(1)}B`
  if (power >= 100) return `${power.toFixed(0)}M`
  return `${power.toFixed(1)}M`
}

/**
 * 유저 등급별 색상 매핑
 */
const gradeColors: Record<string, string> = {
  'M3': 'bg-yellow-500 text-white',
  'M2': 'bg-yellow-400 text-yellow-900',
  'M1': 'bg-yellow-300 text-yellow-900',
  'S2': 'bg-purple-500 text-white',
  'S1': 'bg-purple-400 text-purple-900',
  'L3': 'bg-blue-500 text-white',
  'L2': 'bg-blue-400 text-blue-900',
  'L1': 'bg-blue-300 text-blue-900',
  'O7': 'bg-green-500 text-white',
  'O6': 'bg-green-400 text-green-900',
  'O5': 'bg-green-300 text-green-900',
  'O4': 'bg-gray-500 text-white',
  'O3': 'bg-gray-400 text-gray-900',
  'O2': 'bg-gray-300 text-gray-900',
  'O1': 'bg-gray-200 text-gray-900',
  'R5': 'bg-amber-500 text-white',
  'R4': 'bg-amber-400 text-amber-900',
  'R3': 'bg-amber-300 text-amber-900',
  'R2': 'bg-amber-200 text-amber-900',
  'R1': 'bg-amber-100 text-amber-900'
}

/**
 * 모바일 사용자 카드 컴포넌트
 */
const MobileUserCard: React.FC<{
  user: User
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}> = ({ user, onClick, onEdit, onDelete }) => {
  return (
    <SwipeCard
      onSwipeLeft={onDelete}
      onSwipeRight={onEdit}
      leftActionLabel="삭제"
      rightActionLabel="편집"
      leftActionColor="destructive"
      rightActionColor="success"
      className="mb-3"
    >
      <CardContent className="p-4">
        {/* 메인 정보 행 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* 사용자 아바타 (이니셜) */}
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name.charAt(0)}
              </span>
            </div>
            
            {/* 사용자 기본 정보 */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight mb-1 truncate">
                {user.name}
              </h3>
              
              {/* 유저 등급 배지 */}
              <Badge 
                className={cn(
                  "text-xs font-bold px-2 py-1",
                  gradeColors[user.userGrade] || "bg-gray-200 text-gray-900"
                )}
              >
                {user.userGrade}
              </Badge>
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge
              variant={user.leave ? "destructive" : "default"}
              className="text-xs"
            >
              {user.leave ? "탈퇴" : "활동"}
            </Badge>
            
            <TouchButton
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClick}
            >
              <ChevronRight className="h-4 w-4" />
            </TouchButton>
          </div>
        </div>

        {/* 게임 통계 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">본부 레벨</div>
            <div className="font-semibold text-base">Lv.{user.level}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">전투력</div>
            <div className="font-semibold text-base text-primary">
              {formatPower(user.power)}
            </div>
          </div>
        </div>

        {/* 최근 업데이트 시간 */}
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            최근 업데이트: {new Date(user.updatedAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </CardContent>
    </SwipeCard>
  )
}

/**
 * 데스크톱 테이블 뷰 (기존 컴포넌트 재사용)
 */
const DesktopUserTable: React.FC<MobileUserTableProps> = ({ 
  users, 
  onUserClick, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">닉네임</th>
              <th className="px-4 py-3 text-left text-sm font-medium">레벨</th>
              <th className="px-4 py-3 text-left text-sm font-medium">전투력</th>
              <th className="px-4 py-3 text-left text-sm font-medium">등급</th>
              <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
              <th className="px-4 py-3 text-left text-sm font-medium">최근수정</th>
              <th className="px-4 py-3 text-right text-sm font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.userSeq}
                className="border-t hover:bg-muted/50 cursor-pointer"
                onClick={() => onUserClick?.(user)}
              >
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.level}</td>
                <td className="px-4 py-3 font-medium text-primary">
                  {formatPower(user.power)}
                </td>
                <td className="px-4 py-3">
                  <Badge 
                    className={cn(
                      "text-xs",
                      gradeColors[user.userGrade] || "bg-gray-200 text-gray-900"
                    )}
                  >
                    {user.userGrade}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={user.leave ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {user.leave ? "탈퇴" : "활동중"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(user.updatedAt).toLocaleDateString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-1">
                    {onEdit && (
                      <TouchButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(user)
                        }}
                      >
                        편집
                      </TouchButton>
                    )}
                    {onDelete && (
                      <TouchButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(user)
                        }}
                      >
                        삭제
                      </TouchButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * 메인 반응형 사용자 테이블
 */
export const MobileUserTable: React.FC<MobileUserTableProps> = ({
  users,
  onUserClick,
  onEdit,
  onDelete,
  loading = false
}) => {
  const isMobile = useMobile()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium mb-2">사용자가 없습니다</h3>
            <p className="text-sm">새로운 사용자를 추가해보세요.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 모바일에서는 카드 리스트, 데스크톱에서는 테이블
  if (isMobile) {
    return (
      <div className="space-y-0">
        {users.map((user) => (
          <MobileUserCard
            key={user.userSeq}
            user={user}
            onClick={() => onUserClick?.(user)}
            onEdit={() => onEdit?.(user)}
            onDelete={() => onDelete?.(user)}
          />
        ))}
      </div>
    )
  }

  return (
    <DesktopUserTable
      users={users}
      onUserClick={onUserClick}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

export default MobileUserTable