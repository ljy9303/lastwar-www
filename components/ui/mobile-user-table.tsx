"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button" 
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Eye, ChevronUp, ChevronDown } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import UserDetailModal from "@/components/user/user-detail-modal"

interface MobileUserTableProps {
  users: User[]
  onEdit?: (user: User) => void
}

export function MobileUserTable({ users, onEdit }: MobileUserTableProps) {
  const [selectedUserSeq, setSelectedUserSeq] = useState<number | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof User | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // 전투력 포맷팅 함수 (기존과 동일)
  const formatPower = (power: number): string => {
    if (power === 0) return "0"
    if (power < 1) {
      return `${(power * 100).toFixed(0)}만`
    }
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)}B`
    }
    if (power >= 100) {
      return `${power.toFixed(0)}M`
    }
    return `${power.toFixed(1)}M`
  }

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // 정렬 로직 (기존과 동일)
  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) {
      // 백엔드와 동일한 정렬: leave(asc) -> userGrade(desc) -> power(desc)
      if (a.leave !== b.leave) {
        return a.leave ? 1 : -1
      }
      if (a.userGrade !== b.userGrade) {
        return b.userGrade.localeCompare(a.userGrade)
      }
      return b.power - a.power
    }

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortField === "updatedAt" || sortField === "createdAt") {
      const aDate = new Date(aValue as string)
      const bDate = new Date(bValue as string)
      if (aDate < bDate) return sortDirection === "asc" ? -1 : 1
      if (aDate > bDate) return sortDirection === "asc" ? 1 : -1
      return 0
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleCardClick = (userSeq: number) => {
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
  }

  const handleDetailClick = (e: React.MouseEvent, userSeq: number) => {
    e.stopPropagation()
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation()
    onEdit?.(user)
  }

  // 빈 상태 처리
  if (users.length === 0) {
    return (
      <EmptyState
        variant="users"
        action={{
          label: "새 사용자 추가",
          onClick: () => onEdit?.({} as User)
        }}
      />
    )
  }

  return (
    <>
      {/* 모바일 정렬 컨트롤 */}
      <div className="mb-4 overflow-x-auto" role="toolbar" aria-label="정렬 옵션">
        <div className="flex gap-2 min-w-max">
          <Button
            variant={sortField === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("name")}
            className="flex items-center gap-1 h-10"
            aria-pressed={sortField === "name"}
            aria-label={`닉네임순 정렬${sortField === "name" ? ` (현재 ${sortDirection === "asc" ? "오름차순" : "내림차순"})` : ""}`}
          >
            닉네임
            {sortField === "name" && (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </Button>
          <Button
            variant={sortField === "level" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("level")}
            className="flex items-center gap-1 h-10"
            aria-pressed={sortField === "level"}
            aria-label={`레벨순 정렬${sortField === "level" ? ` (현재 ${sortDirection === "asc" ? "오름차순" : "내림차순"})` : ""}`}
          >
            레벨
            {sortField === "level" && (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </Button>
          <Button
            variant={sortField === "power" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("power")}
            className="flex items-center gap-1 h-10"
            aria-pressed={sortField === "power"}
            aria-label={`전투력순 정렬${sortField === "power" ? ` (현재 ${sortDirection === "asc" ? "오름차순" : "내림차순"})` : ""}`}
          >
            전투력
            {sortField === "power" && (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </Button>
          <Button
            variant={sortField === "userGrade" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("userGrade")}
            className="flex items-center gap-1 h-10"
            aria-pressed={sortField === "userGrade"}
            aria-label={`등급순 정렬${sortField === "userGrade" ? ` (현재 ${sortDirection === "asc" ? "오름차순" : "내림차순"})` : ""}`}
          >
            등급
            {sortField === "userGrade" && (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </Button>
          <Button
            variant={sortField === "leave" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("leave")}
            className="flex items-center gap-1 h-10"
            aria-pressed={sortField === "leave"}
            aria-label={`상태순 정렬${sortField === "leave" ? ` (현재 ${sortDirection === "asc" ? "오름차순" : "내림차순"})` : ""}`}
          >
            상태
            {sortField === "leave" && (
              sortDirection === "asc" ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            )}
          </Button>
        </div>
      </div>

      {/* 모바일 카드 목록 */}
      <div className="space-y-3" role="list" aria-label="사용자 목록">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <Card 
              key={user.userSeq} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleCardClick(user.userSeq)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick(user.userSeq)
                }
              }}
              aria-label={`${user.name} 사용자 정보 - 레벨 ${user.level}, 전투력 ${formatPower(user.power)}, 등급 ${user.userGrade}, ${user.leave ? '탈퇴' : '활동중'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 사용자 이름과 상태 */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base truncate">
                        {user.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.leave 
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }`}>
                        {user.leave ? "탈퇴" : "활동중"}
                      </span>
                    </div>

                    {/* 상세 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">레벨</span>
                        <span className="font-medium">{user.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">전투력</span>
                        <span className="font-medium">{formatPower(user.power)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">등급</span>
                        <span className="font-medium">{user.userGrade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">수정일</span>
                        <span className="font-medium text-xs">
                          {new Date(user.updatedAt).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 - 44px+ 터치 타겟 보장 */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-12 w-12 p-0"
                      onClick={(e) => handleDetailClick(e, user.userSeq)}
                      title="상세정보"
                      aria-label={`${user.name} 상세정보 보기`}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-12 w-12 p-0"
                        onClick={(e) => handleEditClick(e, user)}
                        title="수정"
                        aria-label={`${user.name} 정보 수정`}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUserSeq(null)
        }}
        userSeq={selectedUserSeq}
      />
    </>
  )
}