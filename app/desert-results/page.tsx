"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Save, Filter, ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { getDesertById } from "../actions/event-actions"
import {
  getDesertResultSummary,
  type DesertRosterResult,
  type DesertResultSummary,
} from "../actions/desert-result-actions"
import { DesertEventType } from "@/types/desert"
import { fetchFromAPI } from "@/lib/api-service"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRequiredEvent } from "@/contexts/current-event-context"

export default function DesertResultsPage() {
  const router = useRouter()
  const { eventId, eventTitle, goBack } = useRequiredEvent()
  const desertSeq = eventId || null

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
  // 초기 팀 카운트 - 초기 로딩 시에는 기본값 사용
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({ A: 0, B: 0 })

  const [sortBy, setSortBy] = useState<"name" | "team" | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const [desertResultForm, setDesertResultForm] = useState({
    desertType: "",
    desertResult: null as boolean | null,
    desertDescription: "",
    battleServer: "",
    battleUnion: "",
    battleUnionAlias: "",
    battleUnionRank: ""
  })
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [desertHistory, setDesertHistory] = useState<any>(null)

  // 사막전 결과 히스토리 로드 함수
  const loadDesertHistory = useCallback(
    async (teamType: string) => {
      if (!desertSeq) return

      try {
        const url = `/desert/history/${desertSeq}?desertType=${teamType.toUpperCase()}`
        const historyData = await fetchFromAPI(url)

        // API 응답이 null이거나 빈 응답인 경우 처리
        if (!historyData || Object.keys(historyData).length === 0) {
          console.log("사막전 결과 히스토리가 없습니다.")
          setDesertHistory(null)
          // 데이터가 없으면 폼 초기화
          setDesertResultForm({
            desertType: "",
            desertResult: null,
            desertDescription: "",
            battleServer: "",
            battleUnion: "",
            battleUnionAlias: "",
            battleUnionRank: ""
          })
          return
        }

        setDesertHistory(historyData)

        // 조회된 데이터로 폼 초기화
        if (historyData && typeof historyData === "object") {
          setDesertResultForm({
            desertType: historyData.desertType || "",
            desertResult: historyData.desertResult !== null ? historyData.desertResult : null,
            desertDescription: historyData.desertDescription || "",
            battleServer: historyData.battleServer ? historyData.battleServer.toString() : "",
            battleUnion: historyData.battleUnion || "",
            battleUnionAlias: historyData.battleUnionAlias || "",
            battleUnionRank: historyData.battleUnionRank ? historyData.battleUnionRank.toString() : ""
          })
        } else {
          // 데이터가 유효하지 않으면 폼 초기화
          setDesertResultForm({
              desertType: "",
              desertResult: null,
              desertDescription: "",
              battleServer: "",
              battleUnion: "",
              battleUnionAlias: "",
              battleUnionRank: ""
            })
        }
      } catch (error) {
        console.error("사막전 결과 히스토리 로드 실패:", error)

        // JSON 파싱 에러나 빈 응답인 경우 처리
        if (error instanceof Error && 
            (error.message.includes("Unexpected end of JSON input") || 
             error.message.includes("JSON 파싱 오류") ||
             error.message.includes("Failed to execute 'json'"))) {
          console.log("사막전 결과 히스토리가 비어있거나 유효하지 않습니다.")
          setDesertHistory(null)
        }

        // 에러 시 폼 초기화
        setDesertResultForm({
            desertType: "",
            desertResult: null,
            desertDescription: "",
            battleServer: "",
            battleUnion: "",
            battleUnionAlias: "",
            battleUnionRank: ""
          })
      }
    },
    [desertSeq],
  )

  // 사막전 결과 저장 함수
  const saveDesertResult = useCallback(async () => {
    if (!desertSeq || desertResultForm.desertResult === null) {
      toast({
          title: "입력 오류",
          description: "결과를 선택해주세요.",
          variant: "destructive"
        })
      return
    }

    setIsSavingResult(true)
    try {
      const requestData = {
        desertSeq,
        desertType: activeTab.toUpperCase(), // 현재 활성 탭 사용
        desertResult: desertResultForm.desertResult,
        desertDescription: desertResultForm.desertDescription || undefined,
        battleServer: desertResultForm.battleServer ? Number.parseInt(desertResultForm.battleServer) : undefined,
        battleUnion: desertResultForm.battleUnion || undefined,
        battleUnionAlias: desertResultForm.battleUnionAlias || undefined,
        battleUnionRank: desertResultForm.battleUnionRank
          ? Number.parseInt(desertResultForm.battleUnionRank)
          : undefined,
      }

      await fetchFromAPI(`/desert/result/save`, {
        method: "POST",
        body: JSON.stringify(requestData)
      })

      toast({
        title: "저장 완료",
        description: `${activeTab === "a" ? "A팀" : "B팀"} 사막전 결과가 저장되었습니다.`,
      })
    } catch (error) {
      console.error("사막전 결과 저장 실패:", error)
      toast({
          title: "저장 실패",
          description: "사막전 결과 저장 중 오류가 발생했습니다.",
          variant: "destructive"
        })
    } finally {
      setIsSavingResult(false)
    }
  }, [desertSeq, desertResultForm, activeTab, toast])

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
            variant: "destructive"
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
      // A조만 사용하는 이벤트에서 B팀 탭 선택 차단
      if (selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY && value === "b") {
        return // B팀 탭 전환 무시
      }
      
      setActiveTab(value)
      loadTeamData(value.toUpperCase())
      loadDesertHistory(value) // 사막전 결과 히스토리도 함께 로드
    },
    [loadTeamData, loadDesertHistory, selectedEvent],
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
        let eventData
        try {
          eventData = await getDesertById(desertSeq)
          setSelectedEvent(eventData)
        } catch (error) {
          console.error("사막전 정보 로드 실패:", error)
          eventData = { title: `사막전 #${desertSeq}` }
          setSelectedEvent(eventData)
        }

        // 사막전 결과 로드
        try {
          const url = `/desert/roster/final/${desertSeq}`
          const resultsData = await fetchFromAPI(url)
          setResults(resultsData)
          setFilteredResults(resultsData)

          // 이벤트 타입에 따른 팀별 인원 수 계산
          const counts: Record<string, number> = eventData?.eventType === DesertEventType.A_TEAM_ONLY 
            ? { A: 0 } // A조만 사용하는 이벤트에서는 A팀만 카운트
            : { A: 0, B: 0 } // 기본적으로 A, B 모두 카운트

          resultsData.forEach((result) => {
            const teamType = result.desertType.toUpperCase()
            if (teamType.startsWith("A")) {
              counts.A++
            } else if (teamType.startsWith("B") && eventData?.eventType !== DesertEventType.A_TEAM_ONLY) {
              // A조만 사용하는 이벤트에서는 B팀 카운트 제외
              counts.B = (counts.B || 0) + 1
            }
          })
          setTeamCounts(counts)
        } catch (error) {
          console.error("사막전 결과 로드 실패:", error)
          toast({
              title: "결과 로드 실패",
              description: "사막전 결과를 불러오는 중 오류가 발생했습니다.",
              variant: "destructive"
            })
          setResults([])
          setFilteredResults([])
        }

        // 사막전 결과 요약 로드
        const summaryData = await getDesertResultSummary(desertSeq)
        setEventSummary(summaryData)

        // 이벤트 타입에 따른 초기 탭 설정
        if (eventData?.eventType === DesertEventType.A_TEAM_ONLY) {
          setActiveTab("a") // A조만 사용하는 이벤트에서는 A팀 탭 고정
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        toast({
            title: "데이터 로드 실패",
            description: "사막전 결과를 불러오는 중 오류가 발생했습니다.",
            variant: "destructive"
          })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [desertSeq])

  // 초기 로드 시 A팀 히스토리 로드
  useEffect(() => {
    if (desertSeq) {
      loadDesertHistory("A")
    }
  }, [desertSeq, loadDesertHistory])

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
          description: result.description || ""
        })),
      }

      await fetchFromAPI(`/desert/roster/final/save`, {
        method: "POST",
        body: JSON.stringify(requestData)
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
          variant: "destructive"
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

  // useRequiredEvent 훅에서 이미 eventId 체크를 처리하므로 제거

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">{eventTitle || '사막전 결과'}</h1>
        <div className="ml-auto">
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              사막전 관리
            </Button>
            <Button variant="outline" onClick={() => router.push('/surveys')}>
              사전조사
            </Button>
            <Button variant="outline" onClick={() => router.push('/squads')}>
              스쿼드 관리
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>참여자 출석여부 관리</CardTitle>
                <CardDescription>사막전 참여자들의 출석 여부를 관리합니다.</CardDescription>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
              <TabsList>
                <TabsTrigger value="a">A팀</TabsTrigger>
                {selectedEvent?.eventType !== DesertEventType.A_TEAM_ONLY && (
                  <TabsTrigger value="b">B팀</TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* 사막전 결과 입력 섹션 - 탭 안으로 이동 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY 
                    ? "A팀" 
                    : (activeTab === "a" ? "A팀" : "B팀")
                  } 사막전 결과 입력
                </CardTitle>
                <CardDescription>
                  {selectedEvent?.eventType === DesertEventType.A_TEAM_ONLY 
                    ? "A팀" 
                    : (activeTab === "a" ? "A팀" : "B팀")
                  }의 사막전 결과를 입력하고 저장합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* 결과 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="desertResult">결과 *</Label>
                    <Select
                      value={desertResultForm.desertResult === null ? "" : desertResultForm.desertResult.toString()}
                      onValueChange={(value) =>
                        setDesertResultForm((prev) => ({
                          ...prev,
                          desertResult: value === "" ? null : value === "true",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="결과 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">승리</SelectItem>
                        <SelectItem value="false">패배</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 상대 서버 */}
                  <div className="space-y-2">
                    <Label htmlFor="battleServer">상대 서버</Label>
                    <Input
                      id="battleServer"
                      type="number"
                      placeholder="서버 번호"
                      value={desertResultForm.battleServer}
                      onChange={(e) => setDesertResultForm((prev) => ({ ...prev, battleServer: e.target.value }))}
                    />
                  </div>

                  {/* 상대 연맹 순위 */}
                  <div className="space-y-2">
                    <Label htmlFor="battleUnionRank">상대 연맹 순위</Label>
                    <Input
                      id="battleUnionRank"
                      type="number"
                      placeholder="순위"
                      value={desertResultForm.battleUnionRank}
                      onChange={(e) => setDesertResultForm((prev) => ({ ...prev, battleUnionRank: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* 상대 연맹 */}
                  <div className="space-y-2">
                    <Label htmlFor="battleUnion">상대 연맹</Label>
                    <Input
                      id="battleUnion"
                      placeholder="상대 연맹명"
                      value={desertResultForm.battleUnion}
                      onChange={(e) => setDesertResultForm((prev) => ({ ...prev, battleUnion: e.target.value }))}
                    />
                  </div>

                  {/* 상대 연맹 태그 */}
                  <div className="space-y-2">
                    <Label htmlFor="battleUnionAlias">상대 연맹 태그</Label>
                    <Input
                      id="battleUnionAlias"
                      placeholder="연맹 태그"
                      value={desertResultForm.battleUnionAlias}
                      onChange={(e) => setDesertResultForm((prev) => ({ ...prev, battleUnionAlias: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 비고 */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="description">비고</Label>
                  <Textarea
                    id="description"
                    placeholder="추가 설명이나 특이사항을 입력하세요..."
                    value={desertResultForm.desertDescription}
                    onChange={(e) => setDesertResultForm((prev) => ({ ...prev, desertDescription: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!desertSeq || desertResultForm.desertResult === null) {
                      toast({
                          title: "입력 오류",
                          description: "결과를 선택해주세요.",
                          variant: "destructive"
                        })
                      return
                    }

                    setIsSavingResult(true)
                    try {
                      const requestData = {
                        desertSeq,
                        desertType: activeTab.toUpperCase(), // "A" 또는 "B"
                        desertResult: desertResultForm.desertResult,
                        desertDescription: desertResultForm.desertDescription || undefined,
                        battleServer: desertResultForm.battleServer
                          ? Number.parseInt(desertResultForm.battleServer)
                          : undefined,
                        battleUnion: desertResultForm.battleUnion || undefined,
                        battleUnionAlias: desertResultForm.battleUnionAlias || undefined,
                        battleUnionRank: desertResultForm.battleUnionRank
                          ? Number.parseInt(desertResultForm.battleUnionRank)
                          : undefined,
                      }

                      const response = await fetchFromAPI(`/desert/history/${desertSeq}`, {
                        method: "PATCH",
                        body: JSON.stringify(requestData)
                      })

                      // 응답 데이터로 폼 업데이트 (초기화하지 않음)
                      if (response && typeof response === "object") {
                        setDesertResultForm({
                            desertType: response.desertType || "",
                            desertResult: response.desertResult !== null ? response.desertResult : null,
                            desertDescription: response.desertDescription || "",
                            battleServer: response.battleServer ? response.battleServer.toString() : "",
                            battleUnion: response.battleUnion || "",
                            battleUnionAlias: response.battleUnionAlias || "",
                            battleUnionRank: response.battleUnionRank ? response.battleUnionRank.toString() : ""
                          })
                        setDesertHistory(response)
                      }

                      toast({
                        title: "저장 완료",
                        description: `${activeTab === "a" ? "A팀" : "B팀"} 사막전 결과가 저장되었습니다.`,
                      })
                    } catch (error) {
                      console.error("사막전 결과 저장 실패:", error)
                      toast({
                          title: "저장 실패",
                          description: "사막전 결과 저장 중 오류가 발생했습니다.",
                          variant: "destructive"
                        })
                    } finally {
                      setIsSavingResult(false)
                    }
                  }}
                  disabled={isSavingResult || desertResultForm.desertResult === null}
                  className="w-full md:w-auto"
                >
                  {isSavingResult ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {activeTab === "a" ? "A팀" : "B팀"} 결과 저장
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

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
                    <TableHead className="hidden md:table-cell">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
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
                      <TableCell colSpan={4} className="text-center py-4">
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
