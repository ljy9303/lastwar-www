"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, RefreshCw, ArrowUpDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserSelectionProps {
  users: User[]
  selectedUsers: User[]
  onSelectUsers: (users: User[]) => void
  maxSelections: number
  enableListItemClick?: boolean
}

// 연맹등급 순서 정의
const GRADE_ORDER = {
  "R5": 5,
  "R4": 4,
  "R3": 3,
  "R2": 2,
  "R1": 1,
  "미지정": 0,
  "": 0
} as const

export function UserSelection({
  users,
  selectedUsers,
  onSelectUsers,
  maxSelections,
  enableListItemClick = true,
}: UserSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"power" | "grade">("power")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // 검색 및 정렬된 유저 목록
  const filteredAndSortedUsers = users
    .filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "power") {
        return sortDirection === "desc" ? b.power - a.power : a.power - b.power
      } else {
        // 연맹등급 정렬
        const gradeA = GRADE_ORDER[a.userGrade as keyof typeof GRADE_ORDER] || 0
        const gradeB = GRADE_ORDER[b.userGrade as keyof typeof GRADE_ORDER] || 0
        
        if (gradeA === gradeB) {
          // 등급이 같으면 전투력으로 정렬 (내림차순)
          return b.power - a.power
        }
        
        return sortDirection === "desc" ? gradeB - gradeA : gradeA - gradeB
      }
    })

  // 유저 선택 토글
  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers.some((selectedUser) => selectedUser.userSeq === user.userSeq)

    if (isSelected) {
      onSelectUsers(selectedUsers.filter((selectedUser) => selectedUser.userSeq !== user.userSeq))
    } else {
      if (selectedUsers.length < maxSelections) {
        onSelectUsers([...selectedUsers, user])
      }
    }
  }

  // 모든 유저 선택/해제
  const toggleAllUsers = () => {
    if (selectedUsers.length > 0) {
      onSelectUsers([])
    } else {
      const usersToSelect = filteredAndSortedUsers.slice(0, maxSelections)
      onSelectUsers(usersToSelect)
    }
  }

  // 정렬 변경
  const handleSortChange = (newSortBy: "power" | "grade") => {
    if (sortBy === newSortBy) {
      // 같은 정렬 기준이면 방향만 변경
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      // 다른 정렬 기준이면 새로운 기준으로 변경하고 내림차순으로 시작
      setSortBy(newSortBy)
      setSortDirection("desc")
    }
  }

  // 전투력 포맷팅 함수
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="닉네임으로 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={sortBy === "power" ? "default" : "outline"}
            onClick={() => handleSortChange("power")}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            전투력
            {sortBy === "power" && (
              <span className="text-xs">
                {sortDirection === "desc" ? "↓" : "↑"}
              </span>
            )}
          </Button>
          
          <Button 
            variant={sortBy === "grade" ? "default" : "outline"}
            onClick={() => handleSortChange("grade")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            연맹등급
            {sortBy === "grade" && (
              <span className="text-xs">
                {sortDirection === "desc" ? "↓" : "↑"}
              </span>
            )}
          </Button>
          
          <Button variant="outline" onClick={toggleAllUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {selectedUsers.length > 0 ? "전체 해제" : "전체 선택"}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedUsers.length}/{maxSelections}명 선택됨
      </div>

      <div className="border rounded-md">
        <div className="max-h-[70vh] overflow-y-auto">
          {filteredAndSortedUsers.length > 0 ? (
            <div className="divide-y">
              {filteredAndSortedUsers.map((user) => {
                const isSelected = selectedUsers.some((selectedUser) => selectedUser.userSeq === user.userSeq)
                const isDisabled = !isSelected && selectedUsers.length >= maxSelections

                return (
                  <div
                    key={user.userSeq}
                    className={`flex items-center p-3 hover:bg-accent/50 ${
                      isSelected ? "bg-primary/10" : ""
                    } ${isDisabled ? "opacity-50" : ""} ${!isDisabled || isSelected ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (enableListItemClick && (!isDisabled || isSelected)) {
                        toggleUserSelection(user)
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUserSelection(user)}
                      disabled={isDisabled && !isSelected}
                      className="mr-3"
                      onClick={(e) => e.stopPropagation()} // Prevent double-toggling when clicking the checkbox directly
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.userGrade && (
                          <Badge variant="outline" className="text-xs">
                            {user.userGrade}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lv.{user.level} | {formatPower(user.power)} | 활동중
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">검색 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}
