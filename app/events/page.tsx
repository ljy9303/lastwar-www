"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Search, CalendarDays, ArrowRight, FileSpreadsheet, UserSquare, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"

// 임시 이벤트 데이터
const initialEvents = [
  {
    id: 1,
    name: "4월 4주차 사막전",
    date: "2023-04-22",
    status: "completed",
    participants: 45,
    aTeam: 20,
    bTeam: 20,
  },
  {
    id: 2,
    name: "5월 1주차 사막전",
    date: "2023-05-01",
    status: "in_progress",
    participants: 42,
    aTeam: 20,
    bTeam: 18,
  },
]

export default function EventsPage() {
  const [events, setEvents] = useState(initialEvents)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false)
  const [newEventName, setNewEventName] = useState("")

  // 필터링된 이벤트 목록
  const filteredEvents = events.filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // 이벤트 생성 함수
  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      alert("이벤트 이름을 입력해주세요.")
      return
    }

    const id = events.length > 0 ? Math.max(...events.map((e) => e.id)) + 1 : 1
    const newEvent = {
      id,
      name: newEventName,
      date: new Date().toISOString().split("T")[0],
      status: "created",
      participants: 0,
      aTeam: 0,
      bTeam: 0,
    }

    setEvents([...events, newEvent])
    setIsCreateEventDialogOpen(false)
    setNewEventName("")
  }

  // 상태에 따른 배지 색상
  const getStatusBadge = (status) => {
    switch (status) {
      case "created":
        return <Badge variant="outline">생성됨</Badge>
      case "in_progress":
        return <Badge variant="secondary">진행중</Badge>
      case "completed":
        return <Badge variant="default">완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return format(date, "yyyy년 MM월 dd일", { locale: ko })
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">이벤트 관리</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이벤트 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />새 사막전 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 사막전 이벤트 생성</DialogTitle>
              <DialogDescription>새로운 사막전 이벤트를 생성합니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-name">이벤트 이름</Label>
                <Input
                  id="event-name"
                  placeholder="예: 5월 1주차 사막전"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateEvent}>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  {getStatusBadge(event.status)}
                </div>
                <CardDescription>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">참가자</p>
                    <p className="font-medium">{event.participants}명</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">A팀</p>
                    <p className="font-medium">{event.aTeam}명</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">B팀</p>
                    <p className="font-medium">{event.bTeam}명</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="w-full h-px bg-border my-1"></div>
                <div className="grid grid-cols-4 gap-2 w-full">
                  <Link href={`/surveys?eventId=${event.id}`} className="col-span-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="sr-only">사전조사</span>
                    </Button>
                  </Link>
                  <Link href={`/squads?eventId=${event.id}`} className="col-span-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      <UserSquare className="h-4 w-4" />
                      <span className="sr-only">스쿼드</span>
                    </Button>
                  </Link>
                  <Link href={`/post-events?eventId=${event.id}`} className="col-span-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      <ClipboardList className="h-4 w-4" />
                      <span className="sr-only">사후관리</span>
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}`} className="col-span-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      <ArrowRight className="h-4 w-4" />
                      <span className="sr-only">상세보기</span>
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">등록된 이벤트가 없습니다</h3>
            <p className="text-muted-foreground text-center mb-4">새 사막전 이벤트를 생성하여 관리를 시작하세요.</p>
            <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />새 사막전 생성
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
