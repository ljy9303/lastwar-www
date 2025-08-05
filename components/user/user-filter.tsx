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
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm dark:shadow-black/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">닉네임</Label>
            <Input
              id="name"
              placeholder="닉네임 검색..."
              value={filters.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="transition-colors focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave" className="text-sm font-medium text-foreground">연맹 탈퇴 여부</Label>
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
              <SelectTrigger className="w-full transition-colors focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30">
                <SelectValue placeholder="연맹 탈퇴" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="hover:bg-accent hover:text-accent-foreground">전체</SelectItem>
                <SelectItem value="true" className="hover:bg-accent hover:text-accent-foreground text-red-600 dark:text-red-400">탈퇴</SelectItem>
                <SelectItem value="false" className="hover:bg-accent hover:text-accent-foreground text-green-600 dark:text-green-400">활동중</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleReset}
            className="hover:bg-muted hover:text-foreground transition-colors"
          >
            초기화
          </Button>
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm"
          >
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </div>
      </form>
    </div>
  )
}
