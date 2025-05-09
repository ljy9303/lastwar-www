"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, FileDown, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

// 임시 이벤트 데이터
const events = [
  { id: "1", name: "4월 4주차 사막전" },
  { id: "2", name: "5월 1주차 사막전" },
]

// 임시 결과 데이터
const initialResults = [
  { id: 1, nickname: "용사1", team: "A_TEAM", participated: true, performance: "good", notes: "MVP 활약" },
  { id: 2, nickname: "용사2", team: "B_TEAM", participated: true, performance: "average", notes: "" },
  { id: 3, nickname: "용사3", team: "EXCLUDED", participated: false, performance: "none", notes: "불참" },
  { id: 4, nickname: "용사4", team: "A_RESERVE", participated: true, performance: "good", notes: "예비로 참여" },
  { id: 5, nickname: "용사5", team: "B_TEAM", participated: true, performance: "poor", notes: "초반 탈락" },
]

export default function PostEventsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get("eventId")

  const [results, setResults] = useState(initialResults)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventResult, setEventResult] = useState({ winner: "A_TEAM", notes: "A팀 승리, 총 45명 참여" })

  // 이벤트 ID가 있으면 해당 이벤트 선택
  useEffect(() => {
    if (eventId) {
      const event = events.find((e) => e.id === eventId)
      if (event) {
        setSelectedEvent(event)
      }
    }
  }, [eventId])

  // 필터링된 결과 목록
  const filteredResults = results.filter((result) => result.nickname.toLowerCase().includes(searchTerm.toLowerCase()))

  // 팀 이름 표시
  const getTeamName = (team) => {
    switch (team) {
      case "A_TEAM":
        return "A팀"
      case "B_TEAM":
        return "B팀"
      case "RESERVE_A":
      case "A_RESERVE":
        return "A팀 예비"
      case "RESERVE_B":
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

  // 성과 표시
  const getPerformanceLabel = (performance) => {
    switch (performance) {
      case "excellent":
        return "탁월함"
      case "good":
        return "우수"
      case "average":
        return "보통"
      case "poor":
        return "미흡"
      case "none":
        return "없음"
      default:
        return performance
    }
  }

  // 성과 배지
  const getPerformanceBadge = (performance) => {
    switch (performance) {
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
        return <Badge>{performance}</Badge>
    }
  }

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "닉네임", "팀", "참여 여부", "성과", "비고"]
    const csvContent = [
      headers.join(","),
      ...results.map((result) =>
        [
          result.id,
          result.nickname,
          getTeamName(result.team),
          result.participated ? "O" : "X",
          getPerformanceLabel(result.performance),
          result.notes,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `사후관리_${selectedEvent?.name || "전체"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={eventId ? `/events/${eventId}` : "/events"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">사후 관리 {selectedEvent && `- ${selectedEvent.name}`}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>참여자 성과 관리</CardTitle>
                <CardDescription>사막전 참여자들의 성과와 참여 여부를 관리합니다.</CardDescription>
              </div>
              <Button variant="outline" onClick={exportToCsv}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV 내보내기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                    <TableHead className="hidden md:table-cell">ID</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead className="hidden sm:table-cell">팀</TableHead>
                    <TableHead>참여/성과</TableHead>
                    <TableHead className="hidden sm:table-cell">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="hidden md:table-cell">{result.id}</TableCell>
                        <TableCell>
                          <div>
                            <div>{result.nickname}</div>
                            <div className="sm:hidden text-xs text-muted-foreground">{getTeamName(result.team)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{getTeamName(result.team)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center">
                              {result.participated ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className="text-sm">{result.participated ? "참여" : "불참"}</span>
                            </div>
                            <div>{getPerformanceBadge(result.performance)}</div>
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {result.notes && result.notes.length > 0 ? result.notes : "비고 없음"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{result.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        검색 결과가 없습니다.
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
            <CardTitle>이벤트 결과</CardTitle>
            <CardDescription>사막전 최종 결과를 기록합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">승리 팀</h3>
                <div className="flex gap-2">
                  <Button
                    variant={eventResult.winner === "A_TEAM" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEventResult({ ...eventResult, winner: "A_TEAM" })}
                  >
                    A팀
                  </Button>
                  <Button
                    variant={eventResult.winner === "B_TEAM" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEventResult({ ...eventResult, winner: "B_TEAM" })}
                  >
                    B팀
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">참여 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3 text-center">
                    <div className="text-2xl font-bold">{results.filter((r) => r.participated).length}</div>
                    <div className="text-xs text-muted-foreground">참여</div>
                  </div>
                  <div className="border rounded-md p-3 text-center">
                    <div className="text-2xl font-bold">{results.filter((r) => !r.participated).length}</div>
                    <div className="text-xs text-muted-foreground">불참</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">성과 분포</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">
                      {results.filter((r) => r.performance === "excellent" || r.performance === "good").length}
                    </div>
                    <div className="text-xs text-muted-foreground">우수 이상</div>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">{results.filter((r) => r.performance === "average").length}</div>
                    <div className="text-xs text-muted-foreground">보통</div>
                  </div>
                  <div className="border rounded-md p-2 text-center">
                    <div className="text-lg font-bold">
                      {results.filter((r) => r.performance === "poor" || r.performance === "none").length}
                    </div>
                    <div className="text-xs text-muted-foreground">미흡 이하</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">비고</h3>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={eventResult.notes}
                  onChange={(e) => setEventResult({ ...eventResult, notes: e.target.value })}
                  placeholder="이벤트 결과에 대한 추가 정보를 입력하세요."
                />
              </div>

              <Button className="w-full">결과 저장</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
