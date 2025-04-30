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
import { Switch } from "@/components/ui/switch"
import { Search, FileUp, FileDown, Pencil, Trash, ArrowLeft } from "lucide-react"
import Link from "next/link"

// 임시 유저 데이터
const initialUsers = [
  { id: 1, nickname: "용사1", level: 30, power: 1500000, isLeft: false, preference: "A_TEAM" },
  { id: 2, nickname: "용사2", level: 28, power: 1350000, isLeft: false, preference: "B_TEAM" },
  { id: 3, nickname: "용사3", level: 32, power: 1650000, isLeft: true, preference: "AB_POSSIBLE" },
  { id: 4, nickname: "용사4", level: 25, power: 1200000, isLeft: false, preference: "A_RESERVE" },
  { id: 5, nickname: "용사5", level: 35, power: 1800000, isLeft: false, preference: "B_RESERVE" },
]

// 투표 옵션
const preferenceOptions = [
  { value: "A_TEAM", label: "A팀" },
  { value: "B_TEAM", label: "B팀" },
  { value: "A_RESERVE", label: "A팀 예비" },
  { value: "B_RESERVE", label: "B팀 예비" },
  { value: "AB_POSSIBLE", label: "AB 가능" },
  { value: "AB_IMPOSSIBLE", label: "AB 불가능" },
  { value: "NONE", label: "미참여" },
]

// 임시 이벤트 데이터
const events = [
  { id: "1", name: "4월 4주차 사막전", status: "completed" },
  { id: "2", name: "5월 1주차 사막전", status: "in_progress" },
]

export default function SurveysPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get("eventId")

  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [leftFilter, setLeftFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState("")

  // 이벤트 ID가 있으면 해당 이벤트 선택
  useEffect(() => {
    if (eventId) {
      const event = events.find((e) => e.id === eventId)
      if (event) {
        setSelectedEvent(event)
      }
    }
  }, [eventId])

  // 필터링된 유저 목록
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLeft =
      leftFilter === "all" || (leftFilter === "true" && user.isLeft) || (leftFilter === "false" && !user.isLeft)

    return matchesSearch && matchesLeft
  })

  // 유저 수정 다이얼로그 열기
  const openEditDialog = (user) => {
    setCurrentUser({ ...user })
    setIsEditDialogOpen(true)
  }

  // 유저 정보 수정 함수
  const handleEditUser = () => {
    const updatedUsers = users.map((user) => (user.id === currentUser.id ? currentUser : user))
    setUsers(updatedUsers)
    setIsEditDialogOpen(false)
  }

  // 유저 삭제 함수
  const handleDeleteUser = (id) => {
    if (window.confirm("정말로 이 유저를 삭제하시겠습니까?")) {
      setUsers(users.filter((user) => user.id !== id))
    }
  }

  // 선호도 레이블 가져오기
  const getPreferenceLabel = (preference) => {
    const option = preferenceOptions.find((opt) => opt.value === preference)
    return option ? option.label : preference
  }

  // 선호도 변경 함수
  const handlePreferenceChange = (userId, preference) => {
    const updatedUsers = users.map((user) => (user.id === userId ? { ...user, preference } : user))
    setUsers(updatedUsers)
  }

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "닉네임", "본부레벨", "전투력", "연맹탈퇴여부", "선호팀"]
    const csvContent = [
      headers.join(","),
      ...users.map((user) =>
        [
          user.id,
          user.nickname,
          user.level,
          user.power,
          user.isLeft ? "O" : "X",
          getPreferenceLabel(user.preference),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `사전조사_${selectedEvent?.name || "전체"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 텍스트 데이터 가져오기
  const handleImportData = () => {
    if (!importText.trim()) {
      alert("가져올 데이터를 입력해주세요.")
      return
    }

    try {
      // 간단한 파싱 예시 (실제로는 더 복잡한 로직이 필요할 수 있음)
      const lines = importText.trim().split("\n")
      const newUsers = lines.map((line, index) => {
        const [nickname, level, power, isLeft, preference] = line.split(",").map((item) => item.trim())
        return {
          id: users.length + index + 1,
          nickname,
          level: Number.parseInt(level) || 0,
          power: Number.parseInt(power) || 0,
          isLeft: isLeft === "O" || isLeft === "true",
          preference: preference || "NONE",
        }
      })

      setUsers([...users, ...newUsers])
      setIsImportDialogOpen(false)
      setImportText("")
    } catch (error) {
      alert("데이터 가져오기에 실패했습니다. 형식을 확인해주세요.")
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={eventId ? `/events/${eventId}` : "/events"}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">사전조사 관리 {selectedEvent && `- ${selectedEvent.name}`}</h1>
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
                      형식: 닉네임, 레벨, 전투력, 탈퇴여부(O/X), 선호팀
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="import-data">데이터</Label>
                      <textarea
                        id="import-data"
                        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="용사1, 30, 1500000, X, A_TEAM&#10;용사2, 28, 1350000, X, B_TEAM"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleImportData}>가져오기</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={exportToCsv}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV 내보내기
              </Button>
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

          <div className="flex mb-4">
            <Select value={leftFilter} onValueChange={setLeftFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="연맹 탈퇴" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">탈퇴</SelectItem>
                <SelectItem value="false">활동중</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>본부 레벨</TableHead>
                  <TableHead>전투력</TableHead>
                  <TableHead>연맹 탈퇴</TableHead>
                  <TableHead>선호 팀</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell>{user.level}</TableCell>
                      <TableCell>{user.power.toLocaleString()}</TableCell>
                      <TableCell>{user.isLeft ? "O" : "X"}</TableCell>
                      <TableCell>
                        {selectedEvent?.status !== "completed" ? (
                          <Select
                            value={user.preference || ""}
                            onValueChange={(value) => handlePreferenceChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
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
                        ) : (
                          getPreferenceLabel(user.preference)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 유저 수정 다이얼로그 - 선호팀 필드 제거 */}
      {currentUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>유저 정보 수정</DialogTitle>
              <DialogDescription>유저 정보를 수정하세요.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nickname">닉네임</Label>
                <Input
                  id="edit-nickname"
                  value={currentUser.nickname}
                  onChange={(e) => setCurrentUser({ ...currentUser, nickname: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-level">본부 레벨</Label>
                <Input
                  id="edit-level"
                  type="number"
                  value={currentUser.level}
                  onChange={(e) => setCurrentUser({ ...currentUser, level: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-power">전투력</Label>
                <Input
                  id="edit-power"
                  type="number"
                  value={currentUser.power}
                  onChange={(e) => setCurrentUser({ ...currentUser, power: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isLeft"
                  checked={currentUser.isLeft}
                  onCheckedChange={(checked) => setCurrentUser({ ...currentUser, isLeft: checked })}
                />
                <Label htmlFor="edit-isLeft">연맹 탈퇴 여부</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleEditUser}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
