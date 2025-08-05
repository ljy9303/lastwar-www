"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Pencil, Loader2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getRosters, updateRoster, saveRosters, type Roster } from "@/app/actions/roster-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { getUserById } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { UserForm } from "@/components/user/user-form"
import type { User } from "@/types/user"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesertEventType } from "@/types/desert"
import { useRequiredEvent } from "@/contexts/current-event-context"

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

// 전체 투표 옵션
const allPreferenceOptions = [
  { value: "A_TEAM", label: "A조" },
  { value: "B_TEAM", label: "B조" },
  { value: "A_RESERVE", label: "A조 예비" },
  { value: "B_RESERVE", label: "B조 예비" },
  { value: "AB_POSSIBLE", label: "모두 가능" },
  { value: "NONE", label: "미배정" },
]

// 이벤트 타입에 따른 선호팀 옵션 필터링
const getPreferenceOptions = (eventType?: string) => {
  if (eventType === DesertEventType.A_TEAM_ONLY) {
    // A조만 사용하는 이벤트의 경우 B팀 관련 옵션 제외
    return allPreferenceOptions.filter(option => 
      !["B_TEAM", "B_RESERVE", "AB_POSSIBLE"].includes(option.value)
    )
  }
  // A_B_TEAM이거나 타입이 없는 경우 모든 옵션 사용
  return allPreferenceOptions
}

export default function SurveysPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { eventId, eventTitle, goBack } = useRequiredEvent()

  const [rosters, setRosters] = useState<Roster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [leftFilter, setLeftFilter] = useState("all") // 이 상태는 현재 사용되지 않는 것으로 보입니다.
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRoster, setCurrentRoster] = useState<
    | (Roster & {
        editName?: string
        editLevel?: number
        editPower?: number
        editLeave?: boolean
        userGrade?: string
      })
    | null
  >(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({})
  const [sortConfig, setSortConfig] = useState<{
    keys: { key: string; direction: "ascending" | "descending" }[]
  }>({
    keys: []
  })

  const isMobileDevice = useMobile() // useMobile 훅 사용

  // 상태 변수 추가 - useState 부분 아래에 추가
  const [selectedTeamType, setSelectedTeamType] = useState<string | null>(null)
  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)

  // useRequiredEvent 훅에서 이미 처리하므로 제거

  // 이벤트 정보와 사전조사 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return

      setIsLoading(true)
      try {
        
        // 이벤트 정보 로드
        const eventData = await getDesertById(Number(eventId))
        setSelectedEvent(eventData)

        // 사전조사 데이터 로드
        const rostersData = await getRosters(Number(eventId))
        setRosters(rostersData)
        
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId])

  // 글로벌 키보드 입력 시 검색창으로 포커스 이동
  useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.contentEditable === "true"

      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
        return
      }

      if (!isInputFocused && event.key.match(/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]$/)) {
        const searchInput = document.querySelector('input[placeholder="닉네임으로 검색..."]') as HTMLInputElement
        if (searchInput) {
          event.preventDefault()
          searchInput.focus()
          setSearchTerm(event.key)
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyPress)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress)
    }
  }, [])

  // 현재 이벤트 타입에 맞는 선호팀 옵션 계산
  const preferenceOptions = getPreferenceOptions(selectedEvent?.eventType)

  const getIntentTypeCounts = () => {
    const counts: Record<string, number> = {
      A_TEAM: 0,
      B_TEAM: 0,
      A_RESERVE: 0,
      B_RESERVE: 0,
      AB_POSSIBLE: 0,
      NONE: 0
    }
    const effectiveRosters = rosters.map((roster) => ({
      ...roster,
      intentType: pendingChanges[roster.userSeq] || roster.intentType,
    }))
    effectiveRosters.forEach((roster) => {
      if (counts.hasOwnProperty(roster.intentType)) {
        counts[roster.intentType]++
      }
    })
    
    // A조만 사용하는 이벤트의 경우 B팀 관련 카운트 제외
    if (selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY) {
      return {
        A_TEAM: counts.A_TEAM,
        A_RESERVE: counts.A_RESERVE,
        NONE: counts.NONE + counts.B_TEAM + counts.B_RESERVE + counts.AB_POSSIBLE, // B팀 관련은 NONE에 합산
      }
    }
    
    return counts
  }

  const getTeamMembers = (teamType: string) => {
    const effectiveRosters = rosters.map((roster) => ({
      ...roster,
      intentType: pendingChanges[roster.userSeq] || roster.intentType,
    }))
    return effectiveRosters.filter((roster) => roster.intentType === teamType)
  }

  const requestSort = (key: string) => {
    const newSortConfig = { ...sortConfig }
    const existingKeyIndex = newSortConfig.keys.findIndex((item) => item.key === key)
    if (existingKeyIndex > -1) {
      if (newSortConfig.keys[existingKeyIndex].direction === "ascending") {
        newSortConfig.keys[existingKeyIndex].direction = "descending"
      } else {
        newSortConfig.keys.splice(existingKeyIndex, 1)
      }
    } else {
      newSortConfig.keys.push({ key, direction: "ascending" })
    }
    setSortConfig(newSortConfig)
  }

  const getSortedRosters = (rostersToSort: Roster[]) => {
    const sortableRosters = [...rostersToSort]
    if (sortConfig.keys.length === 0) {
      return sortableRosters
    }
    return sortableRosters.sort((a, b) => {
      for (const { key, direction } of sortConfig.keys) {
        let comparison = 0
        if (key === "userName") comparison = a.userName.localeCompare(b.userName)
        else if (key === "userLevel") comparison = a.userLevel - b.userLevel
        else if (key === "userPower") comparison = a.userPower - b.userPower
        else if (key === "intentType") comparison = a.intentType.localeCompare(b.intentType)
        if (comparison !== 0) return direction === "ascending" ? comparison : -comparison
      }
      return 0
    })
  }

  const filteredRosters = getSortedRosters(
    rosters.filter((roster) => {
      const matchesSearch = roster.userName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = teamFilter === "all" || roster.intentType === teamFilter
      return matchesSearch && matchesTeam
    }),
  )

  const openEditDialog = async (roster: Roster) => {
    try {
      // Fetch complete user information including userGrade
      const userData = await getUserById(roster.userSeq)
      
      setCurrentRoster({
        ...roster,
        editName: userData.name,
        editLevel: userData.level,
        editPower: userData.power,
        editLeave: userData.leave,
        userGrade: userData.userGrade
      })
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error)
      toast({
        title: "오류 발생",
        description: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleEditSuccess = async (updatedUser: User) => {
    setIsEditDialogOpen(false)
    const updatedRosters = await getRosters(Number(eventId))
    setRosters(updatedRosters)
    toast({
      title: "수정 완료",
      description: `${updatedUser.name}님의 정보가 수정되었습니다.`,
    })
  }

  const getPreferenceLabel = (preference: string) => {
    const option = preferenceOptions.find((opt) => opt.value === preference)
    return option ? option.label : preference
  }

  const handlePreferenceChange = (userSeq: number, intentType: string) => {
    setPendingChanges((prev) => ({ ...prev, [userSeq]: intentType }))
  }

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return
    setIsSaving(true)
    try {
      const request = {
        desertSeq: Number(eventId),
        rosters: Object.entries(pendingChanges).map(([userSeq, intentType]) => ({
          userSeq: Number(userSeq),
          intentType,
        })),
      }
      await saveRosters(request)
      setRosters((prev) =>
        prev.map((roster) =>
          pendingChanges[roster.userSeq] ? { ...roster, intentType: pendingChanges[roster.userSeq] } : roster,
        ),
      )
      setPendingChanges({})
      toast({
        title: "저장 완료",
        description: "사전조사 변경 사항이 저장되었습니다."
      })
    } catch (error) {
      console.error("사전조사 저장 실패:", error)
      toast({
        title: "오류 발생",
        description: "사전조사 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // useRequiredEvent 훅에서 이미 eventId 체크를 처리하므로 제거

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">사전조사 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-3xl font-bold truncate">
            {eventTitle || '사전조사 관리'}
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" onClick={goBack}>
            사막전 관리
          </Button>
          <Button variant="outline" onClick={() => router.push('/squads')}>
            스쿼드 관리
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>사전조사 데이터</CardTitle>
              <CardDescription>외부에서 수집한 사전조사 데이터를 관리합니다.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-auto">
                {Object.keys(pendingChanges).length > 0 && (
                  <Button onClick={saveChanges} disabled={isSaving} size="sm" className="w-full group">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        변경사항 저장
                        <Badge
                          className="absolute -top-2 -right-2 bg-primary text-primary-foreground transition-all group-hover:scale-110"
                          variant="outline"
                        >
                          {Object.keys(pendingChanges).length}
                        </Badge>
                        <span className="sr-only">{Object.keys(pendingChanges).length}개의 변경사항</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={(el) => {
                  if (el && searchTerm.length === 1) {
                    setTimeout(() => {
                      el.setSelectionRange(el.value.length, el.value.length)
                    }, 0)
                  }
                }}
                placeholder="닉네임으로 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="선호팀 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 선호팀</SelectItem>
                  {preferenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="sticky top-0 z-10 pt-2 pb-4 bg-background border-b mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(getIntentTypeCounts()).map(([type, count]) => {
                const option = preferenceOptions.find((opt) => opt.value === type)
                const label = option ? option.label : type
                const teamMembers = getTeamMembers(type)
                let bgColor = "bg-muted"
                let textColor = "text-foreground"
                let isOverLimit = false
                if (type === "A_TEAM" || type === "B_TEAM") {
                  isOverLimit = count > 20
                  if (isOverLimit) {
                    bgColor = "bg-red-100 dark:bg-red-900"
                    textColor = "text-red-700 dark:text-red-300"
                  } else {
                    if (type === "A_TEAM") {
                      bgColor = "bg-blue-100 dark:bg-blue-900"
                      textColor = "text-blue-700 dark:text-blue-300"
                    } else {
                      bgColor = "bg-green-100 dark:bg-green-900"
                      textColor = "text-green-700 dark:text-green-300"
                    }
                  }
                } else if (type === "A_RESERVE" || type === "B_RESERVE") {
                  isOverLimit = count > 10
                  if (isOverLimit) {
                    bgColor = "bg-red-100 dark:bg-red-900"
                    textColor = "text-red-700 dark:text-red-300"
                  } else {
                    if (type === "A_RESERVE") {
                      bgColor = "bg-blue-50 dark:bg-blue-800"
                      textColor = "text-blue-600 dark:text-blue-200"
                    } else {
                      bgColor = "bg-green-50 dark:bg-green-800"
                      textColor = "text-green-600 dark:text-green-200"
                    }
                  }
                } else if (type === "AB_POSSIBLE") {
                  bgColor = "bg-purple-100 dark:bg-purple-900"
                  textColor = "text-purple-700 dark:text-purple-300"
                } else if (type === "NONE") {
                  bgColor = "bg-gray-100 dark:bg-gray-800"
                  textColor = "text-gray-700 dark:text-gray-300"
                }
                return (
                  <Popover key={type}>
                    <PopoverTrigger asChild>
                      <div
                        className={`rounded-lg p-3 ${bgColor} transition-all hover:shadow-md cursor-pointer`}
                        onClick={() => {
                          setSelectedTeamType(type)
                          setIsTeamMembersDialogOpen(true)
                        }}
                      >
                        <div className="text-xs font-medium mb-1">{label}</div>
                        <div className={`text-xl font-bold ${textColor} flex items-center`}>
                          {count}명
                          {isOverLimit && (
                            <span className="ml-2 text-xs font-normal bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded-full">
                              정원초과
                            </span>
                          )}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0" align="center">
                      <div className="p-3">
                        <h4 className="font-medium mb-2">{label} 멤버 목록</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          {teamMembers.length > 0 ? (
                            <ul className="space-y-1">
                              {teamMembers.slice(0, 10).map((member) => (
                                <li key={member.userSeq} className="text-sm">
                                  {member.userName}{" "}
                                  <span className="text-xs text-muted-foreground">Lv.{member.userLevel} | {formatPower(member.userPower)}</span>
                                </li>
                              ))}
                              {teamMembers.length > 10 && (
                                <li className="text-sm text-muted-foreground pt-1 border-t">
                                  외 {teamMembers.length - 10}명 더 있음...
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">멤버가 없습니다</p>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort("userName")}>
                    <div className="flex items-center">
                      닉네임
                      {sortConfig.keys.find((item) => item.key === "userName")?.direction === "ascending" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : sortConfig.keys.find((item) => item.key === "userName")?.direction === "descending" ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden sm:table-cell cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort("userLevel")}
                  >
                    <div className="flex items-center">
                      본부 레벨
                      {sortConfig.keys.find((item) => item.key === "userLevel")?.direction === "ascending" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : sortConfig.keys.find((item) => item.key === "userLevel")?.direction === "descending" ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden sm:table-cell cursor-pointer hover:bg-muted/50"
                    onClick={() => requestSort("userPower")}
                  >
                    <div className="flex items-center">
                      전투력
                      {sortConfig.keys.find((item) => item.key === "userPower")?.direction === "ascending" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : sortConfig.keys.find((item) => item.key === "userPower")?.direction === "descending" ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    유저 등급
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort("intentType")}>
                    <div className="flex items-center">
                      선호 팀
                      {sortConfig.keys.find((item) => item.key === "intentType")?.direction === "ascending" ? (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      ) : sortConfig.keys.find((item) => item.key === "intentType")?.direction === "descending" ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRosters.length > 0 ? (
                  filteredRosters.map((roster) => (
                    <TableRow key={roster.userSeq} id={`user-${roster.userSeq}`}>
                      <TableCell>
                        <div>
                          <div>{roster.userName}</div>
                          <div className="sm:hidden text-xs text-muted-foreground">
                            Lv.{roster.userLevel} | {formatPower(roster.userPower)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{roster.userLevel}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatPower(roster.userPower)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{roster.userGrade || '-'}</TableCell>
                      <TableCell>
                        {isMobileDevice ? (
                          <Select
                            value={pendingChanges[roster.userSeq] || roster.intentType}
                            onValueChange={(value) => handlePreferenceChange(roster.userSeq, value)}
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
                                onClick={() => handlePreferenceChange(roster.userSeq, option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(roster)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      {searchTerm ? "검색 결과가 없습니다." : "사전조사 데이터가 없습니다."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {currentRoster && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>유저 정보 수정</DialogTitle>
              <DialogDescription>{currentRoster.userName}님의 정보를 수정하세요.</DialogDescription>
            </DialogHeader>
            <UserForm
              mode="edit"
              user={{
                userSeq: currentRoster.userSeq,
                name: currentRoster.editName || currentRoster.userName,
                level: currentRoster.editLevel || currentRoster.userLevel,
                power: currentRoster.editPower || currentRoster.userPower,
                leave: currentRoster.editLeave || false,
                userGrade: currentRoster.userGrade || "R5",
                id: 0,
                createdAt: "",
                updatedAt: ""
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isTeamMembersDialogOpen} onOpenChange={setIsTeamMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTeamType && preferenceOptions.find((opt) => opt.value === selectedTeamType)?.label} 멤버 목록
            </DialogTitle>
            <DialogDescription>
              {selectedTeamType && `총 ${getTeamMembers(selectedTeamType).length}명의 멤버가 있습니다.`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedTeamType && getTeamMembers(selectedTeamType).length > 0 ? (
              <div className="space-y-2">
                {getTeamMembers(selectedTeamType).map((member) => (
                  <div key={member.userSeq} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <div className="font-medium">{member.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        Lv.{member.userLevel} | {formatPower(member.userPower)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsTeamMembersDialogOpen(false)
                        const userRow = document.getElementById(`user-${member.userSeq}`)
                        if (userRow) {
                          userRow.scrollIntoView({ behavior: "smooth", block: "center" })
                          userRow.classList.add("bg-accent")
                          setTimeout(() => {
                            userRow.classList.remove("bg-accent")
                          }, 2000)
                        }
                      }}
                    >
                      찾기
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">멤버가 없습니다</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
