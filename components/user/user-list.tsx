"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, ChevronUp, ChevronDown, Eye } from "lucide-react"
import UserDetailModal from "./user-detail-modal"
import { EmptyState } from "@/components/ui/empty-state"

interface UserListProps {
  users: User[]
  onEdit?: (user: User) => void
}

export function UserList({ users, onEdit }: UserListProps) {
  const [selectedUserSeq, setSelectedUserSeq] = useState<number | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // 전투력 포맷팅 함수 (1 = 1백만)
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

  // 백엔드 기본 정렬과 일치: 연맹활동중 -> 등급 -> 전투력 순
  const [sortField, setSortField] = useState<keyof User | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
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


  const handleRowClick = (userSeq: number) => {
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
  }

  const handleDetailClick = (e: React.MouseEvent, userSeq: number) => {
    e.stopPropagation()
    setSelectedUserSeq(userSeq)
    setIsDetailModalOpen(true)
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                  className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary transition-colors"
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
                <TableRow 
                  key={user.userSeq} 
                  className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors duration-150"
                  onClick={() => handleRowClick(user.userSeq)}
                >
                  <TableCell>
                    <div>
                      <div>{user.name}</div>
                      <div className="sm:hidden text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">Lv.{user.level}</span>
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">{formatPower(user.power)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            user.userGrade === 'R5' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            user.userGrade === 'R4' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            user.userGrade === 'R3' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            user.userGrade === 'R2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>{user.userGrade}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            user.leave 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {user.leave ? "탈퇴" : "활동중"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{user.level}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatPower(user.power)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.userGrade === 'R5' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      user.userGrade === 'R4' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      user.userGrade === 'R3' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      user.userGrade === 'R2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {user.userGrade}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.leave 
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}>
                      {user.leave ? "탈퇴" : "활동중"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleDateString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handleDetailClick(e, user.userSeq)}
                        title="상세정보"
                        className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(user)
                          }}
                          title="수정"
                          className="hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
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
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUserSeq(null)
        }}
        userSeq={selectedUserSeq}
      />
    </>
  )
}
