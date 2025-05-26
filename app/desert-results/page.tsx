"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, FileDown, Save, Filter, ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { getDesertById } from "../actions/event-actions"
import {
  getDesertResultSummary,
  type DesertRosterResult,
  type DesertResultSummary,
} from "../actions/desert-result-actions"
import { fetchFromAPI } from "@/lib/api-service"

// 성과 태그 옵션
const PERFORMANCE_TAGS = [
  { value: "total", label: "종합점수", icon: "🏆", color: "bg-purple-500" },
  { value: "command", label: "거점점수", icon: "🏰", color: "bg-green-500" },
  { value: "gather", label: "자원수집", icon: "💎", color: "bg-blue-500" },
  { value: "break", label: "구조물파괴", icon: "🔨", color: "bg-orange-500" },
  { value: "kill", label: "적처치", icon: "⚔️", color: "bg-red-500" },
]

export default function DesertResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get("eventId")
  const desertSeq = eventId ? Number.parseInt(eventId) : null

  const [results, setResults] = useState<DesertRosterResult[]>([])
  const [filteredResults, setFilteredResults] = useState<DesertRosterResult[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventSummary, setEventSummary] = useState<DesertResultSummary | null>(null)
  const [activeTab, setActiveTab] = useState("a")
  const [pendingChanges, setPendingChanges] = useState<Record<number, DesertRosterResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showOnlyParticipated, setShowOnlyParticipated] = useState(false)
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({
    A: 0,
    B: 0,
  })

  const [sortBy, setSortBy] = useState<"name" | "team" | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // 팀별 데이터 로드 함수 수정
  const loadTeamData = useCallback(
    async (team: string) => {
      if (!desertSeq) return

      try {
        setIsLoading(true)

        // 팀별 결과 로드 (GET 파라미터로 desertType 추가)
        const url = `/desert/roster/final/${desertSeq}?desertType=${team}`
        const resultsData = await fetchFromAPI(url)
        setResults(resultsData)
        setFilteredResults(resultsData)

        // 팀별 인원 수는 현재 로드된 데이터로만 계산
        const counts = { A: 0, B: 0 }
        resultsData.forEach((result) => {
          const teamType = result.desertType.toUpperCase()
          if (teamType.startsWith("A")) {
            counts.A++
          } else if (teamType.startsWith("B")) {
            counts.B++
          }
        })
        setTeamCounts(counts)
      } catch (error) {
        console.error("팀별 결과 로드 실패:", error)
        toast({
          title: "결과 로드 실패",
          description: "팀별 결과를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [desertSeq],
  )

  // 탭 변경 시 해당 팀 데이터 로드
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      loadTeamData(value.toUpperCase())
    },
    [loadTeamData],
  )

  // 이벤트 및 결과 데이터 로드
  useEffect(() => {
    async function loadData() {
      if (!desertSeq) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // 사막전 정보 로드
        try {
          const eventData = await getDesertById(desertSeq)
          setSelectedEvent(eventData)
        } catch (error) {
          console.error("사막전 정보 로드 실패:", error)
          setSelectedEvent({ title: `사막전 #${desertSeq}` })
        }

        // 사막전 결과 로드
        try {
          const url = `/desert/roster/final/${desertSeq}`
          const resultsData = await fetchFromAPI(url)
          setResults(resultsData)
          setFilteredResults(resultsData)

          // 팀별 인원 수 계산
          const counts = { A: 0, B: 0 }
          resultsData.forEach((result) => {
            const teamType = result.desertType.toUpperCase()
            if (teamType.startsWith("A")) {
              counts.A++
            } else if (teamType.startsWith("B")) {
              counts.B++
            }
          })
          setTeamCounts(counts)
        } catch (error) {
          console.error("사막전 결과 로드 실패:", error)
          toast({
            title: "결과 로드 실패",
            description: "사막전 결과를 불러오는 중 오류가 발생했습니다.",
            variant: "destructive",
          })
          setResults([])
          setFilteredResults([])
        }

        // 사막전 결과 요약 로드
        try {
          const summaryData = await getDesertResultSummary(desertSeq)
          setEventSummary(summaryData)
        } catch (error) {
          console.error("사막전 결과 요약 로드 실패:", error)
          setEventSummary({
            desertSeq,
            winnerType: "",
            description: "",
          })
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
          title: "데이터 로드 실패",
          description: "사막전 결과를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [desertSeq])

  // 변경사항 추적
  const trackChange = useCallback((result: DesertRosterResult) => {
    setPendingChanges((prev) => ({
      ...prev,
      [result.userSeq]: result,
    }))
  }, [])

  // 참여 여부 변경
  const handleParticipationChange = useCallback(
    (userSeq: number, isPlayed: boolean) => {
      const result = results.find((r) => r.userSeq === userSeq)
      if (result) {
        const updatedResult = { ...result, isPlayed }
        trackChange(updatedResult)

        // 로컬 상태 즉시 업데이트
        setResults((prev) => prev.map((item) => (item.userSeq === userSeq ? updatedResult : item)))
      }
    },
    [results, trackChange],
  )

  // 비고 변경
  const handleDescriptionChange = useCallback(
    (userSeq: number, description: string) => {
      const result = results.find((r) => r.userSeq === userSeq)
      if (result) {
        const updatedResult = { ...result, description }
        trackChange(updatedResult)

        // 로컬 상태 즉시 업데이트
        setResults((prev) => prev.map((item) => (item.userSeq === userSeq ? updatedResult : item)))
      }
    },
    [results, trackChange],
  )

  // 성과 태그 변경
  const handleTagChange = useCallback(
    (userSeq: number, tag: string) => {
      const result = results.find((r) => r.userSeq === userSeq)
      if (!result) return

      // 현재 사용자가 이미 해당 태그를 가지고 있으면 제거
      if (result.tag === tag) {
        const updatedResult = { ...result, tag: "none" }
        trackChange(updatedResult)
        setResults((prev) => prev.map((item) => (item.userSeq === userSeq ? updatedResult : item)))
        return
      }

      // 현재 팀에서 해당 태그를 이미 가진 사람이 있는지 확인
      const currentTeam = result.desertType.toUpperCase().charAt(0) // A 또는 B
      const existingUser = results.find(
        (r) => r.userSeq !== userSeq && r.desertType.toUpperCase().startsWith(currentTeam) && r.tag === tag,
      )

      if (existingUser) {
        // 기존 사용자의 태그를 제거하고 새 사용자에게 배정
        const updatedExistingUser = { ...existingUser, tag: "none" }
        const updatedNewUser = { ...result, tag }

        trackChange(updatedExistingUser)
        trackChange(updatedNewUser)

        setResults((prev) =>
          prev.map((item) => {
            if (item.userSeq === existingUser.userSeq) return updatedExistingUser
            if (item.userSeq === userSeq) return updatedNewUser
            return item
          }),
        )

        toast({
          title: "성과 이전",
          description: `${existingUser.name}의 ${PERFORMANCE_TAGS.find((t) => t.value === tag)?.label}이 ${result.name}에게 이전되었습니다.`,
        })
      } else {
        // 해당 태그를 가진 사람이 없으면 새로 배정
        const updatedResult = { ...result, tag }
        trackChange(updatedResult)
        setResults((prev) => prev.map((item) => (item.userSeq === userSeq ? updatedResult : item)))
      }
    },
    [results, trackChange],
  )

  // 성과 버튼이 비활성화되어야 하는지 확인
  const isTagDisabled = useCallback(
    (userSeq: number, tagValue: string) => {
      const result = results.find((r) => r.userSeq === userSeq)
      if (!result) return true

      // 현재 사용자가 이미 해당 태그를 가지고 있으면 활성화 (제거 가능)
      if (result.tag === tagValue) return false

      // 현재 팀에서 해당 태그를 이미 가진 다른 사람이 있는지 확인
      const currentTeam = result.desertType.toUpperCase().charAt(0) // A 또는 B
      const existingUser = results.find(
        (r) => r.userSeq !== userSeq && r.desertType.toUpperCase().startsWith(currentTeam) && r.tag === tagValue,
      )

      return !!existingUser // 다른 사람이 이미 가지고 있으면 비활성화
    },
    [results],
  )

  // 정렬 처리
  const handleSort = useCallback(
    (field: "name" | "team") => {
      if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      } else {
        setSortBy(field)
        setSortOrder("asc")
      }
    },
    [sortBy, sortOrder],
  )

  // 모든 변경사항 저장
  const saveAllChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return

    try {
      setIsSaving(true)

      const requestData = {
        desertSeq,
        rosters: Object.values(pendingChanges).map((result) => ({
          userSeq: result.userSeq,
          isPlayed: result.isPlayed,
          tag: result.tag || "none",
          description: result.description || "",
        })),
      }

      await fetchFromAPI(`/desert/roster/final/save`, {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      setPendingChanges({})

      toast({
        title: "저장 완료",
        description: `${Object.keys(pendingChanges).length}개의 결과가 저장되었습니다.`,
      })
    } catch (error) {
      console.error("결과 업데이트 실패:", error)
      toast({
        title: "저장 실패",
        description: "결과를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [pendingChanges, desertSeq])

  // 팀 이름 표시
  const getTeamName = useCallback((team: string) => {
    switch (team) {
      case "A_TEAM":
        return "A팀"
      case "B_TEAM":
        return "B팀"
      case "A_RESERVE":
        return "A팀 예비"
      case "B_RESERVE":
        return "B팀 예비"
      case "UNASSIGNED":
        return "미배정"
      case "EXCLUDED":
        return "제외"
      default:
        return team
    }
  }, [])

  // 성과 배지
  const getPerformanceBadge = useCallback((tag: string) => {
    const performanceTag = PERFORMANCE_TAGS.find((t) => t.value === tag)
    if (performanceTag) {
      return (
        <Badge className={performanceTag.color}>
          {performanceTag.icon} {performanceTag.label}
        </Badge>
      )
    }
    return tag ? <Badge>{tag}</Badge> : null
  }, [])

  // CSV 내보내기
  const exportToCsv = useCallback(() => {
    if (!results.length) return

    const headers = ["ID", "닉네임", "팀", "참여 여부", "성과", "비고"]
    const csvContent = [
      headers.join(","),
      ...results.map((result) => {
        const performanceLabel = PERFORMANCE_TAGS.find((t) => t.value === result.tag)?.label || result.tag || "없음"
        return [
          result.userSeq,
          result.name,
          getTeamName(result.desertType),
          result.isPlayed ? "O" : "X",
          performanceLabel,
          `"${result.description?.replace(/"/g, '""') || "없음"}"`,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `사막전결과_${selectedEvent?.title || "전체"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [results, selectedEvent, getTeamName])

  // 검색어와 필터에 따라 결과 필터링 및 정렬
  useEffect(() => {
    if (!results.length) {
      setFilteredResults([])
      return
    }

    let filtered = [...results]

    // 검색어로 필터링
    if (searchTerm) {
      filtered = filtered.filter((result) => result.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // 탭에 따라 필터링
    if (activeTab === "a") {
      filtered = filtered.filter((result) => result.desertType.toUpperCase().startsWith("A"))
    } else if (activeTab === "b") {
      filtered = filtered.filter((result) => result.desertType.toUpperCase().startsWith("B"))
    }

    // 참여자만 표시 옵션
    if (showOnlyParticipated) {
      filtered = filtered.filter((result) => result.isPlayed)
    }

    // 정렬 적용
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue: string
        let bValue: string

        if (sortBy === "name") {
          aValue = a.name
          bValue = b.name
        } else if (sortBy === "team") {
          aValue = a.desertType
          bValue = b.desertType
        } else {
          return 0
        }

        const comparison = aValue.localeCompare(bValue)
        return sortOrder === "asc" ? comparison : -comparison
      })
    }

    setFilteredResults(filtered)
  }, [results, searchTerm, activeTab, showOnlyParticipated, sortBy, sortOrder])

  if (!desertSeq) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">사막전 결과</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-center">사막전을 선택해주세요.</p>
            <Button asChild className="mt-4 mx-auto block">
              <Link href="/events">사막전 목록으로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${desertSeq}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">사막전 결과 {selectedEvent && `- ${selectedEvent.title}`}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>참여자 성과 관리</CardTitle>
                <CardDescription>사막전 참여자들의 성과와 참여 여부를 관리합니다.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={saveAllChanges}
                  disabled={Object.keys(pendingChanges).length === 0 || isSaving}
                  className="mr-2"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "저장 중..." : `저장 (${Object.keys(pendingChanges).length})`}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowOnlyParticipated(!showOnlyParticipated)}
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showOnlyParticipated ? "모든 인원 표시" : "참여자만 표시"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="outline" onClick={exportToCsv} disabled={!results.length}>
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV 내보내기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
              <TabsList>
                <TabsTrigger value="a">A팀 ({teamCounts.A})</TabsTrigger>
                <TabsTrigger value="b">B팀 ({teamCounts.B})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="닉네임으로 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort("name")}
                      >
                        닉네임
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-medium hover:bg-transparent"
                        onClick={() => handleSort("team")}
                      >
                        팀
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">참석여부</TableHead>
                    <TableHead className="hidden sm:table-cell">성과</TableHead>
                    <TableHead className="hidden md:table-cell">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        데이터를 불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <TableRow key={result.userSeq}>
                        <TableCell>
                          <div>
                            <div>{result.name}</div>
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {getTeamName(result.desertType)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{getTeamName(result.desertType)}</TableCell>
                        <TableCell>
                          <Button
                            variant={result.isPlayed ? "default" : "outline"}
                            size="sm"
                            className={`w-20 h-8 transition-all ${
                              result.isPlayed ? "bg-green-500 hover:bg-green-600" : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => handleParticipationChange(result.userSeq, !result.isPlayed)}
                          >
                            {result.isPlayed ? "참석" : "불참"}
                          </Button>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {result.tag &&
                            result.tag !== "none" &&
                            PERFORMANCE_TAGS.find((t) => t.value === result.tag) ? (
                              // 현재 선택된 태그가 있으면 해당 태그와 제거 버튼 표시
                              <div className="flex items-center gap-1">
                                <Badge className={PERFORMANCE_TAGS.find((t) => t.value === result.tag)?.color}>
                                  {PERFORMANCE_TAGS.find((t) => t.value === result.tag)?.icon}{" "}
                                  {PERFORMANCE_TAGS.find((t) => t.value === result.tag)?.label}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1 h-auto text-xs"
                                  onClick={() => handleTagChange(result.userSeq, result.tag)}
                                >
                                  수정
                                </Button>
                              </div>
                            ) : (
                              // 선택된 태그가 없으면 모든 태그 버튼 표시
                              PERFORMANCE_TAGS.map((tag) => {
                                const isSelected = result.tag === tag.value
                                const isDisabled = isTagDisabled(result.userSeq, tag.value)

                                return (
                                  <Button
                                    key={tag.value}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    disabled={isDisabled}
                                    className={`px-2 py-1 h-auto text-xs transition-all ${
                                      isSelected
                                        ? `${tag.color} text-white hover:opacity-80`
                                        : isDisabled
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:bg-gray-100"
                                    }`}
                                    onClick={() => handleTagChange(result.userSeq, tag.value)}
                                  >
                                    <span className="mr-1">{tag.icon}</span>
                                    <span>{tag.label}</span>
                                  </Button>
                                )
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Input
                            placeholder="비고"
                            value={result.description || ""}
                            onChange={(e) => handleDescriptionChange(result.userSeq, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {results.length > 0 ? (
                          <>
                            <p>검색 결과가 없습니다.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activeTab === "b" && teamCounts.B === 0
                                ? "B팀에 배정된 인원이 없습니다."
                                : "필터 조건을 변경해보세요."}
                            </p>
                          </>
                        ) : (
                          "데이터가 없습니다."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
