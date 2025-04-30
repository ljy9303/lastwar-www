"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileDown, FileUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// 임시 유저 데이터
const initialUsers = [
  { id: 1, nickname: "용사1", level: 30, power: 1500000, isLeft: false },
  { id: 2, nickname: "용사2", level: 28, power: 1350000, isLeft: false },
  { id: 3, nickname: "용사3", level: 32, power: 1650000, isLeft: true },
  { id: 4, nickname: "용사4", level: 25, power: 1200000, isLeft: false },
  { id: 5, nickname: "용사5", level: 35, power: 1800000, isLeft: false },
]

// 임시 투표 데이터
const initialVotes = [
  { id: 1, userId: 1, preference: "A_TEAM" },
  { id: 2, userId: 2, preference: "B_TEAM" },
  { id: 3, userId: 4, preference: "AB_POSSIBLE" },
]

export default function VotesPage() {
  const [users] = useState(initialUsers)
  const [votes, setVotes] = useState(initialVotes)
  const [searchTerm, setSearchTerm] = useState("")
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentVote, setCurrentVote] = useState(null)

  // 새 투표 폼 상태
  const [newVote, setNewVote] = useState({
    userId: "",
    preference: "",
  })

  // 필터링된 투표 목록
  const filteredVotes = votes.filter((vote) => {
    const user = users.find((u) => u.id === vote.userId)
    return user && user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // 투표 옵션
  const voteOptions = [
    { value: "A_TEAM", label: "A팀" },
    { value: "B_TEAM", label: "B팀" },
    { value: "A_RESERVE", label: "A팀 예비" },
    { value: "B_RESERVE", label: "B팀 예비" },
    { value: "AB_POSSIBLE", label: "AB 가능" },
    { value: "AB_IMPOSSIBLE", label: "AB 불가능" },
  ]

  // 투표 추가 함수
  const handleAddVote = () => {
    // 이미 투표한 유저인지 확인
    const existingVote = votes.find((v) => v.userId === Number.parseInt(newVote.userId))

    if (existingVote) {
      alert("이미 투표한 유저입니다. 수정을 이용해주세요.")
      return
    }

    const id = votes.length > 0 ? Math.max(...votes.map((v) => v.id)) + 1 : 1
    const newVoteWithId = {
      id,
      userId: Number.parseInt(newVote.userId),
      preference: newVote.preference,
    }

    setVotes([...votes, newVoteWithId])

    // 폼 초기화
    setNewVote({
      userId: "",
      preference: "",
    })

    setIsVoteDialogOpen(false)
  }

  // 투표 수정 함수
  const handleEditVote = () => {
    const updatedVotes = votes.map((vote) => (vote.id === currentVote.id ? currentVote : vote))

    setVotes(updatedVotes)
    setIsEditDialogOpen(false)
  }

  // 투표 삭제 함수
  const handleDeleteVote = (id) => {
    if (window.confirm("정말로 이 투표를 삭제하시겠습니까?")) {
      setVotes(votes.filter((vote) => vote.id !== id))
    }
  }

  // 수정 다이얼로그 열기
  const openEditDialog = (vote) => {
    setCurrentVote({ ...vote })
    setIsEditDialogOpen(true)
  }

  // 투표 옵션 레이블 가져오기
  const getPreferenceLabel = (preference) => {
    const option = voteOptions.find((opt) => opt.value === preference)
    return option ? option.label : preference
  }

  // 유저 이름 가져오기
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.nickname : `유저 #${userId}`
  }

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = ["ID", "유저", "선호 팀"]
    const csvContent = [
      headers.join(","),
      ...votes.map((vote) => [vote.id, getUserName(vote.userId), getPreferenceLabel(vote.preference)].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `투표목록_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">사전 투표 등록</h1>

      <Card>
        <CardHeader>
          <CardTitle>투표 목록</CardTitle>
          <CardDescription>유저의 사막전 팀 희망 투표를 관리합니다.</CardDescription>
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

            <div className="flex gap-2">
              <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>투표 등록</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 투표 등록</DialogTitle>
                    <DialogDescription>유저의 사막전 팀 희망 투표를 등록하세요.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="userId">유저 선택</Label>
                      <Select
                        value={newVote.userId.toString()}
                        onValueChange={(value) => setNewVote({ ...newVote, userId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="유저 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => !votes.some((v) => v.userId === user.id))
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.nickname} (Lv.{user.level})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="preference">투표 옵션</Label>
                      <RadioGroup
                        value={newVote.preference}
                        onValueChange={(value) => setNewVote({ ...newVote, preference: value })}
                      >
                        {voteOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value}>{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsVoteDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddVote}>등록</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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

          {votes.length === 0 ? (
            <Alert>
              <AlertDescription>등록된 투표가 없습니다. 새 투표를 등록해주세요.</AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>유저</TableHead>
                    <TableHead>선호 팀</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVotes.map((vote) => (
                    <TableRow key={vote.id}>
                      <TableCell>{vote.id}</TableCell>
                      <TableCell>{getUserName(vote.userId)}</TableCell>
                      <TableCell>{getPreferenceLabel(vote.preference)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(vote)}>
                            수정
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteVote(vote.id)}>
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 투표 수정 다이얼로그 */}
      {currentVote && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>투표 수정</DialogTitle>
              <DialogDescription>{getUserName(currentVote.userId)}님의 투표를 수정하세요.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-preference">투표 옵션</Label>
                <RadioGroup
                  value={currentVote.preference}
                  onValueChange={(value) => setCurrentVote({ ...currentVote, preference: value })}
                >
                  {voteOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`edit-${option.value}`} />
                      <Label htmlFor={`edit-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleEditVote}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
