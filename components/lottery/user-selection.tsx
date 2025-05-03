"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserSelectionProps {
  users: User[]
  selectedUsers: User[]
  onSelectUsers: (users: User[]) => void
  maxSelections: number
}

export function UserSelection({ users, selectedUsers, onSelectUsers, maxSelections }: UserSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    minLevel: "",
    maxLevel: "",
    minPower: "",
    maxPower: "",
    leaveStatus: "all",
  })

  // 필터링된 유저 목록
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMinLevel = filters.minLevel === "" || user.level >= Number.parseInt(filters.minLevel)
    const matchesMaxLevel = filters.maxLevel === "" || user.level <= Number.parseInt(filters.maxLevel)
    const matchesMinPower = filters.minPower === "" || user.power >= Number.parseInt(filters.minPower)
    const matchesMaxPower = filters.maxPower === "" || user.power <= Number.parseInt(filters.maxPower)
    const matchesLeaveStatus =
      filters.leaveStatus === "all" ||
      (filters.leaveStatus === "active" && !user.leave) ||
      (filters.leaveStatus === "left" && user.leave)

    return (
      matchesSearch && matchesMinLevel && matchesMaxLevel && matchesMinPower && matchesMaxPower && matchesLeaveStatus
    )
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
      const usersToSelect = filteredUsers.slice(0, maxSelections)
      onSelectUsers(usersToSelect)
    }
  }

  // 필터 적용
  const applyFilters = () => {
    setIsFilterDialogOpen(false)
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      minLevel: "",
      maxLevel: "",
      minPower: "",
      maxPower: "",
      leaveStatus: "all",
    })
    setSearchTerm("")
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
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>유저 필터</DialogTitle>
              <DialogDescription>유저 목록을 필터링합니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLevel">최소 레벨</Label>
                  <Input
                    id="minLevel"
                    type="number"
                    placeholder="최소 레벨"
                    value={filters.minLevel}
                    onChange={(e) => setFilters({ ...filters, minLevel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLevel">최대 레벨</Label>
                  <Input
                    id="maxLevel"
                    type="number"
                    placeholder="최대 레벨"
                    value={filters.maxLevel}
                    onChange={(e) => setFilters({ ...filters, maxLevel: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPower">최소 전투력</Label>
                  <Input
                    id="minPower"
                    type="number"
                    placeholder="최소 전투력"
                    value={filters.minPower}
                    onChange={(e) => setFilters({ ...filters, minPower: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPower">최대 전투력</Label>
                  <Input
                    id="maxPower"
                    type="number"
                    placeholder="최대 전투력"
                    value={filters.maxPower}
                    onChange={(e) => setFilters({ ...filters, maxPower: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveStatus">연맹 탈퇴 상태</Label>
                <Select
                  value={filters.leaveStatus}
                  onValueChange={(value) => setFilters({ ...filters, leaveStatus: value })}
                >
                  <SelectTrigger id="leaveStatus">
                    <SelectValue placeholder="연맹 탈퇴 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활동중</SelectItem>
                    <SelectItem value="left">탈퇴</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFilters}>
                초기화
              </Button>
              <Button onClick={applyFilters}>적용</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={toggleAllUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {selectedUsers.length > 0 ? "전체 해제" : "전체 선택"}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedUsers.length}/{maxSelections}명 선택됨
      </div>

      <div className="border rounded-md">
        <div className="max-h-[400px] overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.some((selectedUser) => selectedUser.userSeq === user.userSeq)
                const isDisabled = !isSelected && selectedUsers.length >= maxSelections

                return (
                  <div
                    key={user.userSeq}
                    className={`flex items-center p-3 hover:bg-accent/50 ${
                      isSelected ? "bg-primary/10" : ""
                    } ${isDisabled ? "opacity-50" : ""}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUserSelection(user)}
                      disabled={isDisabled && !isSelected}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Lv.{user.level} | {user.power.toLocaleString()} | {user.leave ? "탈퇴" : "활동중"}
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
