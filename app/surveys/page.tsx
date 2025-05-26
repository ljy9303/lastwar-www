"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Pencil,
  Trash,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserSquare,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getRosters, updateRoster, saveRosters, type Roster } from "@/app/actions/roster-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import { UserForm } from "@/components/user/user-form"
import type { User } from "@/types/user"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// 투표 옵션
const preferenceOptions = [
  { value: "A_TEAM", label: "A팀" },
  { value: "B_TEAM", label: "B팀" },
  { value: "A_RESERVE", label: "A팀 예비" },
  { value: "B_RESERVE", label: "B팀 예비" },
  { value: "AB_POSSIBLE", label: "모두 가능" },
  { value: "NONE", label: "미참여" },
]

export default function SurveysPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const eventId = searchParams.get("eventId")

  const [rosters, setRosters] = useState<Roster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [leftFilter, setLeftFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRoster, setCurrentRoster] = useState<
    | (Roster & {
        editName?: string
        editLevel?: number
        editPower?: number
        editLeave?: boolean
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
    keys: [],
  })

  const { isMobile } = useMediaQuery()
  const isMobileDevice = useMobile()

  // 상태 변수 추가 - useState 부분 아래에 추가
  const [selectedTeamType, setSelectedTeamType] = useState<string | null>(null)
  const [isTeamMembersDialogOpen, setIsTeamMembersDialogOpen] = useState(false)

  // 컴포넌트 내부에 useMobile 훅 추가
  // 다른 상태 변수들 아래에 추가:

  // const isMobile = useMobile()

  // 이벤트 ID가 없으면 이벤트 목록 페이지로 리다이렉트
  useEffect(() => {
    if (!eventId) {
      router.push("/events")
    }
  }, [eventId, router])

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
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId, toast])

  // 글로벌 키보드 입력 시 검색창으로 포커스 이동
  useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      // 현재 포커스된 요소가 input, textarea, select가 아닌 경우에만 실행
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.contentEditable === "true"

      // 특수키나 조합키가 눌린 경우 제외
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
        return
      }

      // 입력 요소에 포커스가 없고, 일반 문자키가 입력된 경우
      if (!isInputFocused && event.key.match(/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]$/)) {
        const searchInput = document.querySelector('input[placeholder="닉네임으로 검색..."]') as HTMLInputElement
        if (searchInput) {
          event.preventDefault()
          searchInput.focus()
          // 입력된 문자를 검색창에 추가
          setSearchTerm(event.key)
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyPress)

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress)
    }
  }, [])

  // intentType별 집계 계산 함수
  const getIntentTypeCounts = () => {
    const counts = {
      A_TEAM: 0,
      B_TEAM: 0,
      A_RESERVE: 0,
      B_RESERVE: 0,
      AB_POSSIBLE: 0,
      NONE: 0,
    }

    // 변경 사항이 있는 경우 변경된 값으로 계산
    const effectiveRosters = rosters.map((roster) => ({
      ...roster,
      intentType: pendingChanges[roster.userSeq] || roster.intentType,
    }))

    effectiveRosters.forEach((roster) => {
      if (counts.hasOwnProperty(roster.intentType)) {
        counts[roster.intentType]++
      }
    })

    return counts
  }

  // intentType별 소속 유저 목록 가져오는 함수 추가 - getIntentTypeCounts 함수 아래에 추가
  const getTeamMembers = (teamType: string) => {
    // 변경 사항이 있는 경우 변경된 값으로 계산
    const effectiveRosters = rosters.map((roster) => ({
      ...roster,
      intentType: pendingChanges[roster.userSeq] || roster.intentType,
    }))

    return effectiveRosters.filter((roster) => roster.intentType === teamType)
  }

  // 정렬 요청 처리 함수
  const requestSort = (key: string) => {
    const newSortConfig = { ...sortConfig }
    const existingKeyIndex = newSortConfig.keys.findIndex((item) => item.key === key)

    if (existingKeyIndex > -1) {
      // Key already exists in sort config, toggle direction or remove
      if (newSortConfig.keys[existingKeyIndex].direction === "ascending") {
        newSortConfig.keys[existingKeyIndex].direction = "descending"
      } else {
        // Remove this key from sort config
        newSortConfig.keys.splice(existingKeyIndex, 1)
      }
    } else {
      // Add new key to sort config
      newSortConfig.keys.push({ key, direction: "ascending" })
    }

    setSortConfig(newSortConfig)
  }

  // 정렬된 로스터 목록 가져오기
  const getSortedRosters = (rosters: Roster[]) => {
    const sortableRosters = [...rosters]

    if (sortConfig.keys.length === 0) {
      return sortableRosters
    }

    return sortableRosters.sort((a, b) => {
      // Apply each sort key in order
      for (const { key, direction } of sortConfig.keys) {
        let comparison = 0

        if (key === "userName") {
          comparison = a.userName.localeCompare(b.userName)
        } else if (key === "userLevel") {
          comparison = a.userLevel - b.userLevel
        } else if (key === "userPower") {
          comparison = a.userPower - b.userPower
        } else if (key === "intentType") {
          comparison = a.intentType.localeCompare(b.intentType)
        }

        // If this key gives us a non-zero comparison, return it
        if (comparison !== 0) {
          return direction === "ascending" ? comparison : -comparison
        }

        // Otherwise, continue to the next sort key
      }

      return 0
    })
  }

  // 필터링된 사전조사 목록
  const filteredRosters = getSortedRosters(
    rosters.filter((roster) => {
      const matchesSearch = roster.userName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = teamFilter === "all" || roster.intentType === teamFilter
      return matchesSearch && matchesTeam
    }),
  )

  // 사전조사 수정 다이얼로그 열기
  const openEditDialog = (roster: Roster) => {
    setCurrentRoster({
      ...roster,
      editName: roster.userName,
      editLevel: roster.userLevel,
      editPower: roster.userPower,
      editLeave: false, // API에서 제공하지 않으므로 기본값 설정
    })
    setIsEditDialogOpen(true)
  }

  // 유저 수정 성공 처리
  const handleEditSuccess = async (updatedUser: User) => {
    setIsEditDialogOpen(false)

    // 데이터 다시 로드
    const updatedRosters = await getRosters(Number(eventId))
    setRosters(updatedRosters)

    toast({
      title: "수정 완료",
      description: `${updatedUser.name}님의 정보가 수정되었습니다.`,
    })
  }

  // 사전조사 정보 수정 함수

  // 사전조사 삭제 함수 (intentType을 none으로 설정)
  const handleDeleteRoster = async (roster: Roster) => {
    if (window.confirm(`${roster.userName}님의 사전조사를 삭제하시겠습니까?`)) {
      try {
        await updateRoster(roster.desertSeq, roster.userSeq, "NONE")

        // 로컬 상태 업데이트
        setRosters((prev) => prev.map((r) => (r.userSeq === roster.userSeq ? { ...r, intentType: "NONE" } : r)))

        toast({
          title: "삭제 완료",
          description: `${roster.userName}님의 사전조사가 삭제되었습니다.`,
        })
      } catch (error) {
        console.error("사전조사 삭제 실패:", error)
        toast({
          title: "오류 발생",
          description: "사전조사 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }

  // 선호도 레이블 가져오기
  const getPreferenceLabel = (preference: string) => {
    const option = preferenceOptions.find((opt) => opt.value === preference)
    return option ? option.label : preference
  }

  // 선호도 변경 함수
  const handlePreferenceChange = (userSeq: number, intentType: string) => {
    // 변경 사항 기록
    setPendingChanges((prev) => ({
      ...prev,
      [userSeq]: intentType,
    }))
  }

  // 변경 사항 저장
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

      // 로컬 상태 업데이트
      setRosters((prev) =>
        prev.map((roster) =>
          pendingChanges[roster.userSeq] ? { ...roster, intentType: pendingChanges[roster.userSeq] } : roster,
        ),
      )

      // 변경 사항 초기화
      setPendingChanges({})

      toast({
        title: "저장 완료",
        description: "사전조사 변경 사항이 저장되었습니다.",
      })
    } catch (error) {
      console.error("사전조사 저장 실패:", error)
      toast({
        title: "오류 발생",
        description: "사전조사 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!eventId) {
    return (
      <div className="container mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            사전조사를 조회할 이벤트 ID가 필요합니다. 이벤트 관리 페이지로 이동합니다.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
            사전조사 관리 {selectedEvent && `- ${selectedEvent.title}`}
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" asChild>
            <Link href="/events">사막전 관리</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/squads?eventId=${eventId}`}>
              <UserSquare className="h-4 w-4 mr-2" />
              스쿼드 관리
            </Link>
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
                    // 새로 입력된 단일 문자가 있을 때 커서를 끝으로 이동
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

                // 팀별 색상 설정
                let bgColor = "bg-muted"
                let textColor = "text-foreground"
                let isOverLimit = false

                // 팀별 정원 체크 및 색상 설정
                if (type === "A_TEAM" || type === "B_TEAM") {
                  isOverLimit = count > 20
                  if (isOverLimit) {
                    // 정원 초과
                    bgColor = "bg-red-100 dark:bg-red-900"
                    textColor = "text-red-700 dark:text-red-300"
                  } else {
                    // 정원 이하
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
                    // 정원 초과
                    bgColor = "bg-red-100 dark:bg-red-900"
                    textColor = "text-red-700 dark:text-red-300"
                  } else {
                    // 정원 이하
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
                                  <span className="text-xs text-muted-foreground">Lv.{member.userLevel}</span>
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
                  <TableHead className="hidden md:table-cell">ID</TableHead>
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
                      <TableCell className="hidden md:table-cell">{roster.userSeq}</TableCell>
                      <TableCell>
                        <div>
                          <div>{roster.userName}</div>
                          <div className="sm:hidden text-xs text-muted-foreground">
                            Lv.{roster.userLevel} | {roster.userPower.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{roster.userLevel}</TableCell>
                      <TableCell className="hidden sm:table-cell">{roster.userPower.toLocaleString()}</TableCell>
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRoster(roster)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {searchTerm ? "검색 결과가 없습니다." : "사전조사 데이터가 없습니다."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 사전조사 수정 다이얼로그 */}
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
                name: currentRoster.userName,
                level: currentRoster.userLevel,
                power: currentRoster.userPower,
                leave: false, // API에서 제공하지 않으므로 기본값 설정
                id: 0, // 필요한 경우 적절한 값으로 설정
                createdAt: "",
                updatedAt: "",
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* 팀 멤버 목록 다이얼로그 */}
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
                        Lv.{member.userLevel} | {member.userPower.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsTeamMembersDialogOpen(false)
                        // 테이블에서 해당 유저로 스크롤
                        const userRow = document.getElementById(`user-${member.userSeq}`)
                        if (userRow) {
                          userRow.scrollIntoView({ behavior: "smooth", block: "center" })
                          // 하이라이트 효과
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
