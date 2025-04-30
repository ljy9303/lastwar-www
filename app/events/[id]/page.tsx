"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ArrowLeft, FileSpreadsheet, UserSquare, ClipboardList, Trash } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EventDetailPage({ params }) {
  const router = useRouter()
  const eventId = params.id

  // 실제 구현에서는 이벤트 ID를 기반으로 데이터를 가져와야 함
  const [event, setEvent] = useState({
    id: eventId,
    name: `${eventId === "1" ? "4월 4주차 사막전" : "5월 1주차 사막전"}`,
    date: eventId === "1" ? "2023-04-22" : "2023-05-01",
    status: eventId === "1" ? "completed" : "in_progress",
    participants: eventId === "1" ? 45 : 42,
    aTeam: eventId === "1" ? 20 : 20,
    bTeam: eventId === "1" ? 20 : 18,
    description: "주간 사막전 이벤트입니다. 모든 연맹원들의 참여가 필요합니다.",
    createdAt: eventId === "1" ? "2023-04-20" : "2023-04-28",
  })

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

  // 이벤트 삭제 함수
  const handleDeleteEvent = () => {
    // 실제 구현에서는 API 호출 등을 통해 이벤트 삭제
    router.push("/events")
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/events")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          {getStatusBadge(event.status)}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이벤트 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">이벤트 이름</dt>
                <dd>{event.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">날짜</dt>
                <dd className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(event.date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">상태</dt>
                <dd>{getStatusBadge(event.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">생성일</dt>
                <dd>{formatDate(event.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>참가자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">총 참가자</dt>
                <dd className="text-2xl font-bold">{event.participants}명</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">A팀</dt>
                  <dd className="text-xl font-semibold">{event.aTeam}명</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">B팀</dt>
                  <dd className="text-xl font-semibold">{event.bTeam}명</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>프로세스 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href={`/surveys?eventId=${event.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  사전조사 관리
                </Button>
              </Link>
              <Link href={`/squads?eventId=${event.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <UserSquare className="h-4 w-4 mr-2" />
                  스쿼드 관리
                </Button>
              </Link>
              <Link href={`/post-events?eventId=${event.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  사후 관리
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">이벤트 설명</TabsTrigger>
          <TabsTrigger value="history">변경 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p>{event.description}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 text-sm text-muted-foreground">{formatDate(event.createdAt)}</div>
                  <div>
                    <p className="font-medium">이벤트 생성</p>
                    <p className="text-sm text-muted-foreground">관리자에 의해 이벤트가 생성되었습니다.</p>
                  </div>
                </div>
                {event.status === "in_progress" && (
                  <div className="flex items-start gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{formatDate(event.date)}</div>
                    <div>
                      <p className="font-medium">이벤트 시작</p>
                      <p className="text-sm text-muted-foreground">이벤트가 시작되었습니다.</p>
                    </div>
                  </div>
                )}
                {event.status === "completed" && (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-24 text-sm text-muted-foreground">{formatDate(event.date)}</div>
                      <div>
                        <p className="font-medium">이벤트 시작</p>
                        <p className="text-sm text-muted-foreground">이벤트가 시작되었습니다.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {formatDate(new Date(new Date(event.date).getTime() + 86400000))}
                      </div>
                      <div>
                        <p className="font-medium">이벤트 완료</p>
                        <p className="text-sm text-muted-foreground">이벤트가 성공적으로 완료되었습니다.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
