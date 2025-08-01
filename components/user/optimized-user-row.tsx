"use client"

import { memo, useCallback } from 'react'
import type { User } from "@/types/user"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Eye } from "lucide-react"

interface OptimizedUserRowProps {
  user: User
  onRowClick: (userSeq: number) => void
  onDetailClick: (e: React.MouseEvent, userSeq: number) => void
  onEdit?: (user: User) => void
  formatPower: (power: number) => string
}

/**
 * 성능 최적화된 유저 테이블 행 컴포넌트
 * React.memo를 사용하여 불필요한 리렌더링 방지
 */
export const OptimizedUserRow = memo(function OptimizedUserRow({
  user,
  onRowClick,
  onDetailClick,
  onEdit,
  formatPower
}: OptimizedUserRowProps) {

  const handleRowClick = useCallback(() => {
    onRowClick(user.userSeq)
  }, [onRowClick, user.userSeq])

  const handleDetailClick = useCallback((e: React.MouseEvent) => {
    onDetailClick(e, user.userSeq)
  }, [onDetailClick, user.userSeq])

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(user)
  }, [onEdit, user])

  // 날짜 포맷팅 메모이제이션
  const formattedDate = useCallback(() => {
    return new Date(user.updatedAt).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [user.updatedAt])

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors duration-150"
      onClick={handleRowClick}
    >
      <TableCell>
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="sm:hidden text-xs text-muted-foreground">
            Lv.{user.level} | {formatPower(user.power)} | {user.userGrade} |{" "}
            {user.leave ? "탈퇴" : "활동중"}
          </div>
        </div>
      </TableCell>
      
      <TableCell className="hidden sm:table-cell">
        {user.level}
      </TableCell>
      
      <TableCell className="hidden sm:table-cell">
        {formatPower(user.power)}
      </TableCell>
      
      <TableCell className="hidden sm:table-cell">
        <span className="font-medium">
          {user.userGrade}
        </span>
      </TableCell>
      
      <TableCell className="hidden sm:table-cell">
        <UserStatusBadge isActive={!user.leave} />
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {formattedDate()}
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDetailClick}
            title="상세정보"
            className="h-8 w-8 hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEditClick}
              title="수정"
              className="h-8 w-8 hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
})

/**
 * 유저 상태 배지 컴포넌트 (메모이제이션)
 */
const UserStatusBadge = memo(function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
        isActive 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      }`}
    >
      {isActive ? "활동중" : "탈퇴"}
    </span>
  )
})