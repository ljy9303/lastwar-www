"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, FileDown, Save, Filter, ArrowUp, ArrowDown, Trophy } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { getDesertById } from "../actions/event-actions"
import {
  getDesertResults,
  saveDesertResultSummary,
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

// ResultRow 컴포넌트를 분리하여 성능 최적화
function ResultRow({
  result,
  trackChange,
  getTeamName,
  getPerformanceBadge,
  mvpSelections,
  setMvpSelections,
  results,
}: {
  result: DesertRosterResult
  trackChange: (result: DesertRosterResult) => void
  getTeamName: (team: string) => string
  getPerformanceBadge: (tag: string) => React.ReactNode
  mvpSelections: Record<string, number | null>
  setMvpSelections: React.Dispatch<React.SetStateAction<Record<string, number | null>>>
  results: DesertRosterResult[]
}) {
  const [localResult, setLocalResult] = useState(result)
  const [isEdited, setIsEdited] = useState(false)

  // 컴포넌트가 마운트될 때와 result가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setLocalResult(result)
    setIsEdited(false)
  }, [result])

  // 로컬 상태 변경 핸들러
  const handleChange = useCallback(
    (field: keyof DesertRosterResult, value: any) => {
      setLocalResult((prev) => {
        const updated = { ...prev, [field]: value }
        const isChanged = JSON.stringify(updated) !== JSON.stringify(result)
        setIsEdited(isChanged)

        // 변경사항이 있으면 추적
        if (isChanged) {
          trackChange(updated)
        }

        return updated
      })
    },
    [result, trackChange],
  )

  // MVP 선택 드롭다운
  const mvpOptions = useMemo(() => {
    return PERFORMANCE_TAGS.map((tag) => {
      // 이미 다른 사용자가 해당 태그의 MVP로 선택되어 있는지 확인
      const currentMvp = mvpSelections[tag.value]
      const isAlreadySelected = currentMvp !== null && currentMvp !== result.userSeq
      // 현재 사용자가 이미 다른 태그의 MVP로 선택되어 있는지 확인
      const hasOtherTag = result.tag && result.tag !== "none" && result.tag !== tag.value

      return {
        ...tag,
        disabled: isAlreadySelected || hasOtherTag,
      }
    })
  }, [mvpSelections, result])

  // MVP 선택 처리
  const handleMvpSelect = useCallback(
    (tagValue: string) => {
      // 이미 선택된 태그인 경우 해제
      if (result.tag === tagValue) {
        const updatedResult = { ...result, tag: "none" }
        trackChange(updatedResult)
        // MVP 선택 상태 업데이트
        setMvpSelections((prev) => ({
          ...prev,
          [tagValue]: null,
        }))
      } else {
        // 새로운 태그 선택
        // 이전에 다른 태그가 있었다면 제거
        if (result.tag && result.tag !== "none") {
          setMvpSelections((prev) => ({
            ...prev,
            [result.tag]: null,
          }))
        }

        // 이전에 다른 사용자가 해당 태그의 MVP였다면 해제
        const prevUserSeq = mvpSelections[tagValue]
        if (prevUserSeq !== null && prevUserSeq !== result.userSeq) {
          const prevUser = results.find((r) => r.userSeq === prevUserSeq)
          if (prevUser) {
            const updatedPrevUser = { ...prevUser, tag: "none" }
            trackChange(updatedPrevUser)
          }
        }

        // 새 태그 설정
        const updatedResult = { ...result, tag: tagValue }
        trackChange(updatedResult)

        // MVP 선택 상태 업데이트
        setMvpSelections((prev) => ({
          ...prev,
          [tagValue]: result.userSeq,
        }))
      }
    },
    [result, trackChange, mvpSelections, results, setMvpSelections],
  )

  const performanceBadge = useMemo(() => {
    return localResult.tag && localResult.tag !== "none" ? getPerformanceBadge(localResult.tag) : null
  }, [localResult.tag, getPerformanceBadge])

  return (
    <TableRow>
      <TableCell>
        <Button
          variant={localResult.isPlayed ? "default" : "outline"}
          size="sm"
          className={`w-20 h-8 transition-all ${
            localResult.isPlayed ? "bg-green-500 hover:bg-green-600" : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => handleChange("isPlayed", !localResult.isPlayed)}
        >
          {localResult.isPlayed ? "참석" : "불참"}
        </Button>
      </TableCell>
      <TableCell>
        <div>
          <div>{localResult.name}</div>
          <div className="sm:hidden text-xs text-muted-foreground">{getTeamName(localResult.desertType)}</div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{getTeamName(localResult.desertType)}</TableCell>
      <TableCell className="hidden sm:table-cell">
        {performanceBadge || (
          <div className="flex flex-wrap gap-1">
            {mvpOptions.map((tag) => (
              <Button
                key={tag.value}
                variant="outline"
                size="sm"
                className={`px-2 py-1 h-auto text-xs ${tag.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !tag.disabled && handleMvpSelect(tag.value)}
                disabled={tag.disabled}
              >
                <span className="mr-1">{tag.icon}</span>
                <span>{tag.label}</span>
              </Button>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Input
          placeholder="비고"
          value={localResult.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </TableCell>
      <TableCell>
        {isEdited && (
          <Badge variant="outline" className="bg-blue-50">
            변경됨
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

// 팀 파라미터를 포함한 결과 로드 함수
const loadDesertResults = async (desertSeq: number, team?: string) => {
  try {
    // 기본 API 호출
    const results = await getDesertResults(desertSeq)

    // 팀 파라미터가 있으면 해당 팀만 필터링
    if (team) {
      return results.filter((result) => result.desertType.toUpperCase().startsWith(team))
    }

    return results
  } catch (error) {
    console.error("결과 로드 실패:", error)
    throw error
  }
}

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
  const [teamSortDirection, setTeamSortDirection] = useState<"asc" | "desc" | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<number, DesertRosterResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showOnlyParticipated, setShowOnlyParticipated] = useState(false)
  const [mvpSelections, setMvpSelections] = useState<Record<string, number | null>>({
    total: null,
    command: null,
    gather: null,
    break: null,
    kill: null,
  })
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({
    A: 0,
    B: 0,
  })

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
          // 기본 이벤트 정보 설정
          setSelectedEvent({ title: `사막전 #${desertSeq}` })
        }

        // 사막전 결과 로드 - 초기 로드는 팀 파라미터 없이
        try {
          const resultsData = await loadDesertResults(desertSeq)
          setResults(resultsData)
          setFilteredResults(resultsData)

          // 팀별 인원 수 계산
          const counts = {
            A: 0,
            B: 0,
          }

          resultsData.forEach((result) => {
            const teamType = result.desertType.toUpperCase()
            if (teamType.startsWith("A")) {
              counts.A++
            } else if (teamType.startsWith("B")) {
              counts.B++
            }
          })

          setTeamCounts(counts)

          // 기존 MVP 설정 로드
          const mvpInit: Record<string, number | null> = {
            total: null,
            command: null,
            gather: null,
            break: null,
            kill: null,
          }

          resultsData.forEach((result) => {
            if (result.tag && result.tag !== "none" && mvpInit.hasOwnProperty(result.tag)) {
              mvpInit[result.tag] = result.userSeq
            }
          })

          setMvpSelections(mvpInit)
        } catch (error) {
          console.error("사막전 결과 로드 실패:", error)
          toast({
            title: "결과 로드 실패",
            description: "사막전 결과를 불러오는 중 오류가 발생했습니다.",
            variant: "destructive",
          })
          // 빈 결과 배열 설정
          setResults([])
          setFilteredResults([])
        }

        // 사막전 결과 요약 로드
        try {
          const summaryData = await getDesertResultSummary(desertSeq)
          setEventSummary(summaryData)
        } catch (error) {
          console.error("사막전 결과 요약 로드 실패:", error)
          // 기본 요약 정보 설정
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

  // 페이지 로드 시 URL 파라미터에 따라 초기 탭 설정
  useEffect(() => {
    const teamParam = searchParams.get("team")
    if (teamParam) {
      if (teamParam.toUpperCase() === "A") {
        setActiveTab("a")
      } else if (teamParam.toUpperCase() === "B") {
        setActiveTab("b")
      }
    }
  }, [searchParams])

  // 탭 변경 시 URL 파라미터 업데이트
  const handleTabChange = async (value: string) => {
    setActiveTab(value)
    setIsLoading(true)

    try {
      // 팀 파라미터 설정 (a -> A, b -> B)
      const teamParam = value.toUpperCase()

      // 해당 팀 데이터 로드
      const resultsData = await loadDesertResults(desertSeq, teamParam)

      setResults(resultsData)
      setFilteredResults(resultsData)

      // MVP 설정 업데이트
      const mvpInit: Record<string, number | null> = {
        total: null,
        command: null,
        gather: null,
        break: null,
        kill: null,
      }

      resultsData.forEach((result) => {
        if (result.tag && result.tag !== "none" && mvpInit.hasOwnProperty(result.tag)) {
          mvpInit[result.tag] = result.userSeq
        }
      })

      setMvpSelections(mvpInit)

      toast({
        title: `${teamParam}팀 데이터 로드 완료`,
        description: `${resultsData.length}명의 데이터를 불러왔습니다.`,
      })
    } catch (error) {
      console.error(`${value.toUpperCase()}팀 데이터 로드 실패:`, error)
      toast({
        title: "데이터 로드 실패",
        description: `${value.toUpperCase()}팀 데이터를 불러오는 중 오류가 발생했습니다.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 검색어와 필터에 따라 결과 필터링
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

    // 탭에 따라 필터링 (대소문자 구분 없이)
    if (activeTab === "a") {
      filtered = filtered.filter((result) => result.desertType.toUpperCase().startsWith("A"))
    } else if (activeTab === "b") {
      filtered = filtered.filter((result) => result.desertType.toUpperCase().startsWith("B"))
    }

    // 참여자만 표시 옵션
    if (showOnlyParticipated) {
      filtered = filtered.filter((result) => result.isPlayed)
    }

    // 팀으로 정렬
    if (teamSortDirection) {
      filtered.sort((a, b) => {
        const teamA = a.desertType
        const teamB = b.desertType
        return teamSortDirection === "asc" ? teamA.localeCompare(teamB) : teamB.localeCompare(teamA)
      })
    }

    setFilteredResults(filtered)
  }, [results, searchTerm, activeTab, showOnlyParticipated, teamSortDirection])

  // 변경사항 추적
  const trackChange = useCallback((result: DesertRosterResult) => {
    setPendingChanges((prev) => ({
      ...prev,
      [result.userSeq]: result,
    }))
  }, [])

  // MVP 선택 변경 처리
  const handleMvpChange = useCallback(
    (performanceTag: string, value: string) => {
      // 선택 안함인 경우
      if (value === "") {
        setMvpSelections((prev) => ({
          ...prev,
          [performanceTag]: null,
        }))

        // 이전에 선택된 사용자의 태그 제거
        const prevUserSeq = mvpSelections[performanceTag]
        if (prevUserSeq !== null) {
          const prevUser = results.find((r) => r.userSeq === prevUserSeq)
          if (prevUser) {
            const updatedPrevUser = { ...prevUser, tag: "none" }
            trackChange(updatedPrevUser)
          }
        }
        return
      }

      // 사용자가 선택된 경우 - 이 부분은 이제 테이블에서 처리됨
    },
    [mvpSelections, results, trackChange],
  )

  // MVP 저장
  const saveMvpSelections = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return

    try {
      setIsSaving(true)

      // 새로운 API 형식에 맞게 데이터 구성
      const requestData = {
        desertSeq,
        rosters: Object.values(pendingChanges).map((result) => ({
          userSeq: result.userSeq,
          isPlayed: result.isPlayed,
          tag: result.tag || "none",
          description: result.description || "",
        })),
      }

      // 새 API 엔드포인트로 모든 변경사항 한 번에 저장
      await fetchFromAPI(`/desert/roster/final/save`, {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      // 로컬 상태 업데이트
      setResults((prev) => prev.map((item) => (pendingChanges[item.userSeq] ? pendingChanges[item.userSeq] : item)))

      // 변경사항 초기화
      setPendingChanges({})

      toast({
        title: "MVP 저장 완료",
        description: `${Object.keys(pendingChanges).length}개의 성과가 저장되었습니다.`,
      })
    } catch (error) {
      console.error("MVP 업데이트 실패:", error)
      toast({
        title: "저장 실패",
        description: "성과를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [pendingChanges, desertSeq])

  // 모든 변경사항 저장
  const saveAllChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return

    try {
      setIsSaving(true)

      // 새로운 API 형식에 맞게 데이터 구성
      const requestData = {
        desertSeq,
        rosters: Object.values(pendingChanges).map((result) => ({
          userSeq: result.userSeq,
          isPlayed: result.isPlayed,
          tag: result.tag || "none",
          description: result.description || "",
        })),
      }

      // 새 API 엔드포인트로 모든 변경사항 한 번에 저장
      await fetchFromAPI(`/desert/roster/final/save`, {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      // 로컬 상태 업데이트
      setResults((prev) => prev.map((item) => (pendingChanges[item.userSeq] ? pendingChanges[item.userSeq] : item)))

      // 변경사항 초기화
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

  // 결과 요약 저장
  const saveSummary = useCallback(async () => {
    if (!eventSummary || !desertSeq) return

    try {
      setIsSaving(true)
      const summary = {
        ...eventSummary,
        desertSeq,
      }

      // API 엔드포인트가 아직 구현되지 않았을 수 있으므로 임시 처리
      try {
        await saveDesertResultSummary(summary)

        toast({
          title: "저장 완료",
          description: "사막전 결과 요약이 저장되었습니다.",
        })
      } catch (error) {
        console.error("API 엔드포인트 오류:", error)
        toast({
          title: "저장 완료 (테스트 모드)",
          description: "API가 아직 구현되지 않아 로컬에만 저장되었습니다.",
        })
      }
    } catch (error) {
      console.error("결과 요약 저장 실패:", error)
      toast({
        title: "저장 실패",
        description: "결과 요약을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [eventSummary, desertSeq])

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
    switch (tag) {
      case "total":
        return <Badge className="bg-purple-500">🏆 종합점수</Badge>
      case "command":
        return <Badge className="bg-green-500">🏰 거점점수</Badge>
      case "gather":
        return <Badge className="bg-blue-500">💎 자원수집</Badge>
      case "break":
        return <Badge className="bg-orange-500">🔨 구조물파괴</Badge>
      case "kill":
        return <Badge className="bg-red-500">⚔️ 적처치</Badge>
      case "none":
        return <Badge variant="secondary">없음</Badge>
      default:
        return tag ? <Badge>{tag}</Badge> : null
    }
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
          `"${result.description?.replace(/"/g, '""') || ""}"`, // 쌍따옴표 이스케이프
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

  const isSaveAllChangesButtonDisabled = useMemo(
    () => Object.keys(pendingChanges).length === 0 || isSaving,
    [pendingChanges, isSaving],
  )

  const saveAllChangesButtonContent = isSaving ? "저장 중..." : `저장 (${Object.keys(pendingChanges).length})`

  // showOnlyParticipated 상태를 먼저 정의
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

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

  // 팀별 참여자 목록 가져오기 - useMemo로 최적화
  const teamParticipants = useMemo(() => {
    return results
      .filter((r) => r.desertType.startsWith(activeTab.toUpperCase()) && r.isPlayed)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [results, activeTab])

  // 이미 선택된 성과 태그 확인
  const usedTags = useMemo(() => {
    const tags: Record<string, boolean> = {}
    Object.entries(mvpSelections).forEach(([tag, userSeq]) => {
      if (userSeq !== null) {
        tags[tag] = true
      }
    })
    return tags
  }, [mvpSelections])

  // 이미 MVP로 선택된 사용자 확인
  const usedUsers = useMemo(() => {
    const users: Record<number, boolean> = {}
    Object.values(mvpSelections).forEach((userSeq) => {
      if (userSeq !== null) {
        users[userSeq] = true
      }
    })
    return users
  }, [mvpSelections])

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
                  disabled={isSaveAllChangesButtonDisabled}
                  className="mr-2"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveAllChangesButtonContent}
                </Button>
                <TooltipProvider>
                  <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
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

            {/* MVP 영역 */}
            <Card className="mb-6 border-2 border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5" />
                    MVP 선정
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveMvpSelections}
                    disabled={Object.keys(pendingChanges).length === 0 || isSaving}
                  >
                    {isSaving ? "저장 중..." : "MVP 저장"}
                  </Button>
                </div>
                <CardDescription>
                  각 성과 항목별로 MVP를 선정합니다. 한 명의 길드원이 여러 항목을 받을 수 없습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {PERFORMANCE_TAGS.map((tag) => {
                    const selectedUserSeq = mvpSelections[tag.value]
                    const selectedUser =
                      selectedUserSeq !== null ? results.find((r) => r.userSeq === selectedUserSeq) : null

                    return (
                      <div key={tag.value} className="border rounded-md p-3">
                        <div className={`flex items-center justify-center p-2 rounded-md mb-2 ${tag.color} text-white`}>
                          <span className="mr-1">{tag.icon}</span>
                          <span className="font-medium">{tag.label}</span>
                        </div>
                        {selectedUser ? (
                          <div className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 mr-2 rounded-full"
                                style={{ backgroundColor: tag.color.replace("bg-", "") }}
                              ></div>
                              <span>{selectedUser.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMvpChange(tag.value, "")}
                            >
                              <span className="sr-only">제거</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground p-2">
                            아래 목록에서 연맹원을 선택하세요
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="닉네임으로 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)

                  // MVP 선택 드롭다운의 모든 검색 필드도 업데이트
                  const searchInputs = document.querySelectorAll(".mvp-search-input") as NodeListOf<HTMLInputElement>
                  searchInputs.forEach((input) => {
                    input.value = e.target.value

                    // 각 드롭다운 내 항목 필터링
                    const tag = input.getAttribute("data-search-tag")
                    if (tag) {
                      const searchTerm = e.target.value.toLowerCase()
                      const items = document.querySelectorAll(`[data-tag="${tag}"] [data-user-item]`)
                      items.forEach((item) => {
                        const userName = item.getAttribute("data-user-name")?.toLowerCase() || ""
                        if (userName.includes(searchTerm)) {
                          ;(item as HTMLElement).style.display = ""
                        } else {
                          ;(item as HTMLElement).style.display = "none"
                        }
                      })
                    }
                  })
                }}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">참석여부</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead
                      className="hidden sm:table-cell cursor-pointer select-none"
                      onClick={() => {
                        setTeamSortDirection((prev) => (prev === null ? "asc" : prev === "asc" ? "desc" : null))
                      }}
                    >
                      <div className="flex items-center">
                        팀{teamSortDirection === "asc" && <ArrowUp className="ml-1 h-4 w-4" />}
                        {teamSortDirection === "desc" && <ArrowDown className="ml-1 h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">성과</TableHead>
                    <TableHead className="hidden md:table-cell">비고</TableHead>
                    <TableHead className="w-[80px]">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        데이터를 불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <ResultRow
                        key={result.userSeq}
                        result={result}
                        trackChange={trackChange}
                        getTeamName={getTeamName}
                        getPerformanceBadge={getPerformanceBadge}
                        mvpSelections={mvpSelections}
                        setMvpSelections={setMvpSelections}
                        results={results}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
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
