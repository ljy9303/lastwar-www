"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowLeft, FileDown, Save, Filter } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { getDesertById } from "../actions/event-actions"
import {
  getDesertResults,
  updateDesertResult,
  saveDesertResultSummary,
  getDesertResultSummary,
  type DesertRosterResult,
  type DesertResultSummary,
} from "../actions/desert-result-actions"

// 성과 태그 옵션
const PERFORMANCE_TAGS = [
  { value: "excellent", label: "탁월함" },
  { value: "good", label: "우수" },
  { value: "average", label: "보통" },
  { value: "poor", label: "미흡" },
  { value: "none", label: "없음" },
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showOnlyParticipated, setShowOnlyParticipated] = useState(false)

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
        const eventData = await getDesertById(desertSeq)
        setSelectedEvent(eventData)

        // 사막전 결과 로드
        const resultsData = await getDesertResults(desertSeq)
        setResults(resultsData)
        setFilteredResults(resultsData)

        // 사막전 결과 요약 로드
        const summaryData = await getDesertResultSummary(desertSeq)
        setEventSummary(summaryData)
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

    // 탭에 따라 필터링
    if (activeTab === "a") {
      filtered = filtered.filter((result) => result.desertType.startsWith("A"))
    } else if (activeTab === "b") {
      filtered = filtered.filter((result) => result.desertType.startsWith("B"))
    }

    // 참여자만 표시 옵션
    if (showOnlyParticipated) {
      filtered = filtered.filter((result) => result.isPlayed)
    }

    setFilteredResults(filtered)
  }, [results, searchTerm, activeTab, showOnlyParticipated])

  // 결과 항목 업데이트
  const updateResult = async (updatedResult: DesertRosterResult) => {
    try {
      setIsSaving(true)
      await updateDesertResult(updatedResult)

      // 로컬 상태 업데이트
      setResults((prev) => prev.map((item) => (item.userSeq === updatedResult.userSeq ? updatedResult : item)))

      toast({
        title: "저장 완료",
        description: `${updatedResult.name}의 결과가 저장되었습니다.`,
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
  }

  // 결과 요약 저장
  const saveSummary = async () => {
    if (!eventSummary || !desertSeq) return

    try {
      setIsSaving(true)
      const summary = {
        ...eventSummary,
        desertSeq,
      }

      await saveDesertResultSummary(summary)

      toast({
        title: "저장 완료",
        description: "사막전 결과 요약이 저장되었습니다.",
      })
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
  }

  // 팀 이름 표시
  const getTeamName = (team: string) => {
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
  }

  // 성과 배지
  const getPerformanceBadge = (tag: string) => {
    switch (tag) {
      case "excellent":
        return <Badge className="bg-purple-500">탁월함</Badge>
      case "good":
        return <Badge className="bg-green-500">우수</Badge>
      case "average":
        return <Badge>보통</Badge>
      case "poor":
        return <Badge variant="outline">미흡</Badge>
      case "none":
        return <Badge variant="secondary">없음</Badge>
      default:
        return tag ? <Badge>{tag}</Badge> : null
    }
  }

  // CSV 내보내기
  const exportToCsv = () => {
    if (!results.length) return

    const headers = ["ID", "닉네임", "팀", "참여 여부", "점수", "성과", "비고"]
    const csvContent = [
      headers.join(","),
      ...results.map((result) => {
        const performanceLabel = PERFORMANCE_TAGS.find((t) => t.value === result.tag)?.label || result.tag

        return [
          result.userSeq,
          result.name,
          getTeamName(result.desertType),
          result.isPlayed ? "O" : "X",
          result.score,
          performanceLabel,
          `"${result.description.replace(/"/g, '""')}"`, // 쌍따옴표 이스케이프
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
  }

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

  const ResultRow = ({ result }: { result: DesertRosterResult }) => {
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
          setIsEdited(JSON.stringify(updated) !== JSON.stringify(result))
          return updated
        })
      },
      [result],
    )

    return (
      <TableRow key={result.userSeq}>
        <TableCell>
          <Checkbox checked={localResult.isPlayed} onCheckedChange={(checked) => handleChange("isPlayed", !!checked)} />
        </TableCell>
        <TableCell>
          <div>
            <div>{localResult.name}</div>
            <div className="sm:hidden text-xs text-muted-foreground">{getTeamName(localResult.desertType)}</div>
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell">{getTeamName(localResult.desertType)}</TableCell>
        <TableCell>
          <Input
            type="number"
            min="0"
            value={localResult.score || 0}
            onChange={(e) => handleChange("score", Number.parseInt(e.target.value) || 0)}
            className="w-16 h-8"
          />
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Select value={localResult.tag || "none"} onValueChange={(value) => handleChange("tag", value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_TAGS.map((tag) => (
                <SelectItem key={tag.value} value={tag.value}>
                  {tag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="md:hidden mt-1">
            <Input
              placeholder="비고"
              value={localResult.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="text-xs"
            />
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Input
            placeholder="비고"
            value={localResult.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Button size="sm" variant="ghost" disabled={!isEdited || isSaving} onClick={() => updateResult(localResult)}>
            <Save className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>참여자 성과 관리</CardTitle>
                <CardDescription>사막전 참여자들의 성과와 참여 여부를 관리합니다.</CardDescription>
              </div>
              <div className="flex gap-2">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="a">A팀</TabsTrigger>
                <TabsTrigger value="b">B팀</TabsTrigger>
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
                    <TableHead className="w-[50px]">참여</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead className="hidden sm:table-cell">팀</TableHead>
                    <TableHead className="w-[80px]">점수</TableHead>
                    <TableHead className="hidden sm:table-cell">성과</TableHead>
                    <TableHead className="hidden md:table-cell">비고</TableHead>
                    <TableHead className="w-[80px]">저장</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        데이터를 불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length > 0 ? (
                    filteredResults.map((result) => <ResultRow key={result.userSeq} result={result} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        {results.length > 0 ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사막전 결과</CardTitle>
            <CardDescription>사막전 최종 결과를 기록합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">승리 팀</h3>
                <div className="flex gap-2">
                  <Button
                    variant={eventSummary?.winnerType === "A_TEAM" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEventSummary((prev) => (prev ? { ...prev, winnerType: "A_TEAM" } : null))}
                    disabled={isLoading}
                  >
                    A팀
                  </Button>
                  <Button
                    variant={eventSummary?.winnerType === "B_TEAM" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEventSummary((prev) => (prev ? { ...prev, winnerType: "B_TEAM" } : null))}
                    disabled={isLoading}
                  >
                    B팀
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">참여 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3 text-center">
                    <div className="text-2xl font-bold">{results.filter((r) => r.isPlayed).length}</div>
                    <div className="text-xs text-muted-foreground">참여</div>
                  </div>
                  <div className="border rounded-md p-3 text-center">
                    <div className="text-2xl font-bold">{results.filter((r) => !r.isPlayed).length}</div>
                    <div className="text-xs text-muted-foreground">불참</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">성과 분포</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">
                      {results.filter((r) => r.tag === "excellent" || r.tag === "good").length}
                    </div>
                    <div className="text-xs text-muted-foreground">우수 이상</div>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">{results.filter((r) => r.tag === "average").length}</div>
                    <div className="text-xs text-muted-foreground">보통</div>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">
                      {results.filter((r) => r.tag === "poor" || r.tag === "none").length}
                    </div>
                    <div className="text-xs text-muted-foreground">미흡 이하</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">비고</h3>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={eventSummary?.description || ""}
                  onChange={(e) => setEventSummary((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                  placeholder="사막전 결과에 대한 추가 정보를 입력하세요."
                  disabled={isLoading}
                />
              </div>

              <Button className="w-full" onClick={saveSummary} disabled={isLoading || isSaving || !eventSummary}>
                {isSaving ? "저장 중..." : "결과 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
