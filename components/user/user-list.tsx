"use client"

import { useState, useMemo, useCallback, memo } from "react"
import type { User } from "@/types/user"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"
import UserDetailModal from "./user-detail-modal"
import { EmptyState } from "@/components/ui/empty-state"
import { MobileUserTable } from "@/components/ui/mobile-user-table"
import { OptimizedUserRow } from "./optimized-user-row"
import { useMobile } from "@/hooks/use-mobile"
import { useComponentPerformance } from "@/hooks/use-performance"

interface UserListProps {
  users: User[]
  onEdit?: (user: User) => void
}

export const UserList = memo(function UserList({ users, onEdit }: UserListProps) {
  const [selectedUserSeq, setSelectedUserSeq] = useState<number | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const isMobile = useMobile()
  
  // 성능 모니터링
  const { measureRender } = useComponentPerformance('UserList')

  // 전투력 포맷팅 함수 메모이제이션 (1 = 1백만)
  const formatPower = useCallback((power: number): string => {
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
  }, [])

  // 백엔드 기본 정렬과 일치: 연맹활동중 -> 등급 -> 전투력 순
  const [sortField, setSortField] = useState<keyof User | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = useCallback((field: keyof User) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prevDirection => prevDirection === "asc" ? "desc" : "asc")
        return field
      } else {
        setSortDirection("asc")
        return field
      }
    })
  }, [])

  // 정렬된 유저 목록 메모이제이션
  const sortedUsers = useMemo(() => {
    const measure = measureRender()
    const startSort = measure.start()
    
    const sorted = [...users].sort((a, b) => {
      // 프론트엔드에서 정렬이 선택되지 않은 경우, 백엔드 기본 정렬 유지  
      if (!sortField) {
        // 백엔드와 동일한 정렬: leave(asc) -> userGrade(desc) -> power(desc)
        
        // 1. 연맹활동중 우선 (leave = false가 먼저)
        if (a.leave !== b.leave) {
          return a.leave ? 1 : -1
        }
        
        // 2. 등급 내림차순 (R5, R4, R3... 순)
        if (a.userGrade !== b.userGrade) {
          return b.userGrade.localeCompare(a.userGrade)
        }
        
        // 3. 전투력 내림차순 (높은순)
        return b.power - a.power
      }

      // 사용자가 특정 필드로 정렬을 선택한 경우
      const aValue = a[sortField]
      const bValue = b[sortField]

      // 날짜 필드인 경우 Date 객체로 변환하여 비교
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
    
    startSort.end()
    return sorted
  }, [users, sortField, sortDirection, measureRender])

  const handleRowClick = useCallback((userSeq: number) => {
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
  }, [])

  const handleDetailClick = useCallback((e: React.MouseEvent, userSeq: number) => {
    e.stopPropagation()
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false)
    setSelectedUserSeq(null)
  }, [])

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

  // 모바일에서는 MobileUserTable 사용
  if (isMobile) {
    return <MobileUserTable users={users} onEdit={onEdit} />
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  닉네임
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("level")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  본부 레벨
                  {sortField === "level" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("power")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  전투력
                  {sortField === "power" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("userGrade")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  유저 등급
                  {sortField === "userGrade" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("leave")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  연맹 탈퇴
                  {sortField === "leave" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("updatedAt")}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  최근수정
                  {sortField === "updatedAt" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </Button>
              </TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <OptimizedUserRow
                  key={user.userSeq}
                  user={user}
                  onRowClick={handleRowClick}
                  onDetailClick={handleDetailClick}
                  onEdit={onEdit}
                  formatPower={formatPower}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        userSeq={selectedUserSeq}
      />
    </>
  )
})
