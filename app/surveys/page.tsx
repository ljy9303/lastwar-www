"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileUp, FileDown, Pencil, Trash, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getRosters,
  updateRoster,
  saveRosters,
  type Roster,
  type RosterUpdateRequest,
} from "@/app/actions/roster-actions"
import { getDesertById } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"

// 투표 옵션
const preferenceOptions = [
  { value: "A_TEAM", label: "A팀" },
  { value: "B_TEAM", label: "B팀" },
  { value: "A_RESERVE", label: "A팀 예비" },
  { value: "B_RESERVE", label: "B팀 예비" },
  { value: "AB_POSSIBLE", label: "AB 가능" },
  { value: "AB_IMPOSSIBLE", label: "AB 불가능" },
  { value: "none", label: "미참여" },
]

export default function SurveysPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const eventId = searchParams.get("eventId")

  const [rosters, setRosters] = useState<Roster[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [leftFilter, setLeftFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentRoster, setCurrentRoster] = useState<Roster | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({})

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

  // 필터링된 사전조사 목록
  const filteredRosters = rosters.filter((roster) => {
    const matchesSearch = roster.userName.toLowerCase().includes(searchTerm.toLowerCase())
    // 연맹 탈퇴 여부는 API에서 제공하지 않으므로 필터링하지 않음
    return matchesSearch
  })

  // 사전조사 수정 다이얼로그 열기
  const openEditDialog = (roster: Roster) => {
    setCurrentRoster({ ...roster })
    setIsEditDialogOpen(true)
  }

  // 사전조사 정보 수정 함수
  const handleEditRoster = async () => {
    if (!currentRoster) return

    setIsSaving(true)
    try {
      await updateRoster(currentRoster.desertSeq, currentRoster.userSeq, currentRoster.intentType)

      // 로컬 상태 업데이트
      setRosters((prev) => prev.map((roster) => (roster.userSeq === currentRoster.userSeq ? currentRoster : roster)))

      toast({
        title: "수정 완료",
        description: `${currentRoster.userName}님의 사전조사가 수정되었습니다.`,
      })

      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("사전조사 수정 실패:", error)
      toast({
        title: "오류 발생",
        description: "사전조사 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 사전조사 삭제 함수 (intentType을 none으로 설정)
  const handleDeleteRoster = async (roster: Roster) => {
    if (window.confirm(`${roster.userName}님의 사전조사를 삭제하시겠습니까?`)) {
      try {
        await updateRoster(roster.desertSeq, roster.userSeq, "none")

        // 로컬 상태 업데이트
        setRosters((prev) => prev.map((r) => (r.userSeq === roster.userSeq ? { ...r, intentType: "none" } : r)))

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

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "닉네임", "본부레벨", "전투력", "선호팀"]
    const csvContent = [
      headers.join(","),
      ...rosters.map((roster) =>
        [
          roster.userSeq,
          roster.userName,
          roster.userLevel,
          roster.userPower,
          getPreferenceLabel(roster.intentType),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `사전조사_${selectedEvent?.title || eventId}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 텍스트 데이터 가져오기
  const handleImportData = async () => {
    if (!importText.trim()) {
      toast({
        title: "입력 오류",
        description: "가져올 데이터를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      // 간단한 파싱 예시 (실제로는 더 복잡한 로직이 필요할 수 있음)
      const lines = importText.trim().split("\n")
      const importedRosters: RosterUpdateRequest[] = []

      for (const line of lines) {
        const [userName, intentType] = line.split(",").map((item) => item.trim())

        // 유저 이름으로 userSeq 찾기
        const user = rosters.find((r) => r.userName === userName)
        if (user) {
          // 선호도 값 검증
          const validIntentType = preferenceOptions.find((opt) => opt.label === intentType)?.value || "none"

          importedRosters.push({
            userSeq: user.userSeq,
            intentType: validIntentType,
          })
        }
      }

      if (importedRosters.length === 0) {
        toast({
          title: "가져오기 실패",
          description: "일치하는 유저가 없습니다.",
          variant: "destructive",
        })
        return
      }

      // 데이터 저장
      setIsSaving(true)
      await saveRosters({
        desertSeq: Number(eventId),
        rosters: importedRosters,
      })

      // 데이터 다시 로드
      const updatedRosters = await getRosters(Number(eventId))
      setRosters(updatedRosters)

      setIsImportDialogOpen(false)
      setImportText("")

      toast({
        title: "가져오기 성공",
        description: `${importedRosters.length}개의 사전조사 데이터가 업데이트되었습니다.`,
      })
    } catch (error) {
      console.error("데이터 가져오기 실패:", error)
      toast({
        title: "가져오기 실패",
        description: "데이터 가져오기에 실패했습니다. 형식을 확인해주세요.",
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
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={eventId ? `/events/${eventId}` : "/events"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">사전조사 관리 {selectedEvent && `- ${selectedEvent.title}`}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>사전조사 데이터</CardTitle>
              <CardDescription>외부에서 수집한 사전조사 데이터를 관리합니다.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    데이터 가져오기
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>사전조사 데이터 가져오기</DialogTitle>
                    <DialogDescription>
                      엑셀이나 메모장에서 정리한 데이터를 붙여넣기 하세요.
                      <br />
                      형식: 닉네임, 선호팀
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="import-data">데이터</Label>
                      <textarea
                        id="import-data"
                        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="다크입니다, A팀&#10;주사놔주는봇, B팀"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isSaving}>
                      취소
                    </Button>
                    <Button onClick={handleImportData} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          가져오는 중...
                        </>
                      ) : (
                        "가져오기"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={exportToCsv}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV 내보내기
              </Button>

              {Object.keys(pendingChanges).length > 0 && (
                <Button onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "변경사항 저장"
                  )}
                </Button>
              )}
            </div>
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

          {Object.keys(pendingChanges).length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                {Object.keys(pendingChanges).length}개의 변경사항이 있습니다. 저장 버튼을 클릭하여 변경사항을
                저장하세요.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead className="hidden sm:table-cell">본부 레벨</TableHead>
                  <TableHead className="hidden sm:table-cell">전투력</TableHead>
                  <TableHead>선호 팀</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRosters.length > 0 ? (
                  filteredRosters.map((roster) => (
                    <TableRow key={roster.userSeq}>
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
                        <Select
                          value={pendingChanges[roster.userSeq] || roster.intentType}
                          onValueChange={(value) => handlePreferenceChange(roster.userSeq, value)}
                        >
                          <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {preferenceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
              <DialogTitle>사전조사 수정</DialogTitle>
              <DialogDescription>{currentRoster.userName}님의 사전조사를 수정하세요.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>닉네임</Label>
                  <div className="p-2 border rounded-md bg-muted">{currentRoster.userName}</div>
                </div>
                <div className="space-y-2">
                  <Label>본부 레벨</Label>
                  <div className="p-2 border rounded-md bg-muted">{currentRoster.userLevel}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>전투력</Label>
                <div className="p-2 border rounded-md bg-muted">{currentRoster.userPower.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intentType">선호 팀</Label>
                <Select
                  value={currentRoster.intentType}
                  onValueChange={(value) => setCurrentRoster({ ...currentRoster, intentType: value })}
                >
                  <SelectTrigger id="intentType">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {preferenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                취소
              </Button>
              <Button onClick={handleEditRoster} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
