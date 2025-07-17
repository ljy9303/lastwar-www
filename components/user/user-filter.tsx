"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserSearchParams } from "@/types/user"
import { Search } from "lucide-react"

interface UserFilterProps {
  onFilter: (params: UserSearchParams) => void
  initialFilters?: UserSearchParams
}

export function UserFilter({ onFilter, initialFilters = {} }: UserFilterProps) {
  const [filters, setFilters] = useState<UserSearchParams>({
    leave: initialFilters.leave,
    minLevel: initialFilters.minLevel,
    maxLevel: initialFilters.maxLevel,
    name: initialFilters.name || "",
    power: initialFilters.power,
  })

  const handleChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilter(filters)
  }

  const handleReset = () => {
    const resetFilters = {
      leave: undefined,
      minLevel: undefined,
      maxLevel: undefined,
      name: "",
      power: undefined,
    }
    setFilters(resetFilters)
    onFilter(resetFilters)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">닉네임</Label>
          <Input
            id="name"
            placeholder="닉네임 검색..."
            value={filters.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leave">연맹 탈퇴 여부</Label>
          <Select
            value={filters.leave === undefined ? "all" : filters.leave ? "true" : "false"}
            onValueChange={(value) => {
              if (value === "all") {
                handleChange("leave", undefined)
              } else {
                handleChange("leave", value === "true")
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="연맹 탈퇴" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="true">탈퇴</SelectItem>
              <SelectItem value="false">활동중</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={handleReset}>
          초기화
        </Button>
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          검색
        </Button>
      </div>
    </form>
  )
}
