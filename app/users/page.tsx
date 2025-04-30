"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileDown, FileUp, Pencil, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 임시 유저 데이터
const initialUsers = [
  { id: 1, nickname: "용사1", level: 30, power: 1500000, isLeft: false },
  { id: 2, nickname: "용사2", level: 28, power: 1350000, isLeft: false },
  { id: 3, nickname: "용사3", level: 32, power: 1650000, isLeft: true },
  { id: 4, nickname: "용사4", level: 25, power: 1200000, isLeft: false },
  { id: 5, nickname: "용사5", level: 35, power: 1800000, isLeft: false },
]

// 임시 히스토리 데이터
const initialHistory = [
  { id: 1, userId: 3, date: "2023-04-28", action: "수정", details: "연맹 탈퇴 여부 변경: false → true" },
  { id: 2, userId: 5, date: "2023-04-27", action: "추가", details: "신규 유저 추가" },
  { id: 3, userId: 2, date: "2023-04-26", action: "수정", details: "전투력 변경: 1300000 → 1350000" },
]

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [history, setHistory] = useState(initialHistory)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [powerFilter, setPowerFilter] = useState("all")
  const [leftFilter, setLeftFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 새 유저 폼 상태
  const [newUser, setNewUser] = useState({
    nickname: "",
    level: "",
    power: "",
    isLeft: false,
  })

  // 필터링된 유저 목록
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel =
      levelFilter === "all" ||
      (levelFilter === "30+" && user.level >= 30) ||
      (levelFilter === "20-29" && user.level >= 20 && user.level <= 29) ||
      (levelFilter === "10-19" && user.level >= 10 && user.level <= 19) ||
      (levelFilter === "<10" && user.level < 10)
    const matchesPower =
      powerFilter === "all" ||
      (powerFilter === "1500000+" && user.power >= 1500000) ||
      (powerFilter === "1000000-1499999" && user.power >= 1000000 && user.power <= 1499999) ||
      (powerFilter === "<1000000" && user.power < 1000000)
    const matchesLeft =
      leftFilter === "all" || (leftFilter === "true" && user.isLeft) || (leftFilter === "false" && !user.isLeft)

    return matchesSearch && matchesLevel && matchesPower && matchesLeft
  })

  // 유저 추가 함수
  const handleAddUser = () => {
    const id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1
    const newUserWithId = {
      id,
      nickname: newUser.nickname,
      level: Number.parseInt(newUser.level),
      power: Number.parseInt(newUser.power),
      isLeft: newUser.isLeft,
    }

    setUsers([...users, newUserWithId])

    // 히스토리 추가
    const historyId = history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1
    setHistory([
      {
        id: historyId,
        userId: newUserWithId.id,
        date: new Date().toISOString().split("T")[0],
        action: "추가",
        details: "신규 유저 추가",
      },
      ...history,
    ])

    // 폼 초기화
    setNewUser({
      nickname: "",
      level: "",
      power: "",
      isLeft: false,
    })

    setIsAddDialogOpen(false)
  }

  // 유저 수정 함수
  const handleEditUser = () => {
    const updatedUsers = users.map((user) => (user.id === currentUser.id ? currentUser : user))

    setUsers(updatedUsers)

    // 히스토리 추가
    const historyId = history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1
    setHistory([
      {
        id: historyId,
        userId: currentUser.id,
        date: new Date().toISOString().split("T")[0],
        action: "수정",
        details: `유저 정보 수정`,
      },
      ...history,
    ])

    setIsEditDialogOpen(false)
  }

  // 유저 삭제 함수
  const handleDeleteUser = (id) => {
    if (window.confirm("정말로 이 유저를 삭제하시겠습니까?")) {
      setUsers(users.filter((user) => user.id !== id))

      // 히스토리 추가
      const historyId = history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1
      const deletedUser = users.find((user) => user.id === id)

      setHistory([
        {
          id: historyId,
          userId: id,
          date: new Date().toISOString().split("T")[0],
          action: "삭제",
          details: `유저 삭제: ${deletedUser.nickname}`,
        },
        ...history,
      ])
    }
  }

  // 수정 다이얼로그 열기
  const openEditDialog = (user) => {
    setCurrentUser({ ...user })
    setIsEditDialogOpen(true)
  }

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "닉네임", "본부레벨", "전투력", "연맹탈퇴여부"]
    const csvContent = [
      headers.join(","),
      ...users.map((user) => [user.id, user.nickname, user.level, user.power, user.isLeft ? "O" : "X"].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `유저목록_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">유저 관리</h1>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">유저 목록</TabsTrigger>
          <TabsTrigger value="history">변경 히스토리</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>유저 목록</CardTitle>
              <CardDescription>
                게임 유저 정보를 관리합니다. 검색 및 필터링을 통해 원하는 유저를 찾을 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="닉네임으로 검색..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="본부 레벨" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 레벨</SelectItem>
                      <SelectItem value="30+">30 이상</SelectItem>
                      <SelectItem value="20-29">20-29</SelectItem>
                      <SelectItem value="10-19">10-19</SelectItem>
                      <SelectItem value="<10">10 미만</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={powerFilter} onValueChange={setPowerFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="전투력" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 전투력</SelectItem>
                      <SelectItem value="1500000+">150만 이상</SelectItem>
                      <SelectItem value="1000000-1499999">100만-150만</SelectItem>
                      <SelectItem value="<1000000">100만 미만</SelectItem>
                    </SelectContent>
                  </Select>

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
              </div>

              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        유저 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>새 유저 추가</DialogTitle>
                        <DialogDescription>새로운 유저 정보를 입력하세요.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="nickname">닉네임</Label>
                          <Input
                            id="nickname"
                            value={newUser.nickname}
                            onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="level">본부 레벨</Label>
                          <Input
                            id="level"
                            type="number"
                            value={newUser.level}
                            onChange={(e) => setNewUser({ ...newUser, level: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="power">전투력</Label>
                          <Input
                            id="power"
                            type="number"
                            value={newUser.power}
                            onChange={(e) => setNewUser({ ...newUser, power: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="isLeft"
                            checked={newUser.isLeft}
                            onCheckedChange={(checked) => setNewUser({ ...newUser, isLeft: checked })}
                          />
                          <Label htmlFor="isLeft">연맹 탈퇴 여부</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleAddUser}>추가</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportToCsv}>
                    <FileDown className="mr-2 h-4 w-4" />
                    CSV 내보내기
                  </Button>
                  <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    CSV 가져오기
                  </Button>
                </div>
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
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>변경 히스토리</CardTitle>
              <CardDescription>유저 정보 변경 내역을 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>유저 ID</TableHead>
                      <TableHead>작업</TableHead>
                      <TableHead>상세 내용</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.action}</TableCell>
                        <TableCell>{item.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 유저 수정 다이얼로그 */}
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
