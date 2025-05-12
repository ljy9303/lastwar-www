"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ArrowLeft, FileSpreadsheet, UserSquare, ClipboardList, Trash, Loader2 } from "lucide-react"
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
import { getDesertById, deleteDesert } from "@/app/actions/event-actions"
import { useToast } from "@/hooks/use-toast"
import type { Desert } from "@/app/actions/event-actions"

export default function EventDetailPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const desertSeq = params.id

  const [desert, setDesert] = useState<Desert | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // 사막전 상세 정보 로드
  const loadDesertDetails = async () => {
    setIsLoading(true)
    try {
      const data = await getDesertById(Number(desertSeq))
      setDesert(data)
    } catch (error) {
      console.error("사막전 상세 정보 로드 실패:", error)
      toast({
        title: "오류 발생",
        description: "사막전 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadDesertDetails()
  }, [desertSeq])

  // 상태에 따른 배지 색상
  const getStatusBadge = (deleted: boolean) => {
    return deleted ? <Badge variant="destructive">삭제됨</Badge> : <Badge variant="outline">활성</Badge>
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "yyyy년 MM월 dd일", { locale: ko })
    } catch (error) {
      return dateString
    }
  }

  // 사막전 삭제 함수
  const handleDeleteDesert = async () => {
    setIsDeleting(true)
    try {
      await deleteDesert(Number(desertSeq))
      toast({
        title: "사막전 삭제 성공",
        description: "사막전이 성공적으로 삭제되었습니다.",
      })
      router.push("/events")
    } catch (error) {
      console.error("사막전 삭제 실패:", error)
      toast({
        title: "오류 발생",
        description: "사막전 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  // 참가자 수 계산 (API 연동 후 실제 데이터로 대체 필요)
  const getParticipantCount = () => {
    // 임시로 랜덤 값 반환
    return Math.floor(Math.random() * 30) + 20
  }

  // A팀 인원 수 계산 (API 연동 후 실제 데이터로 대체 필요)
  const getTeamACount = () => {
    // 임시로 랜덤 값 반환
    return Math.floor(Math.random() * 15) + 10
  }

  // B팀 인원 수 계산 (API 연동 후 실제 데이터로 대체 필요)
  const getTeamBCount = () => {
    // 임시로 랜덤 값 반환
    return Math.floor(Math.random() * 15) + 10
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">사막전 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!desert) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/events")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">사막전을 찾을 수 없습니다</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">요청하신 사막전을 찾을 수 없습니다.</p>
            <Button onClick={() => router.push("/events")}>사막전 목록으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/events")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">{desert.title}</h1>
          {getStatusBadge(desert.deleted)}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>사막전 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 사막전을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDesert}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">사막전 이름</dt>
                <dd>{desert.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">날짜</dt>
                <dd className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(desert.eventDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">상태</dt>
                <dd>{getStatusBadge(desert.deleted)}</dd>
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
                <dd className="text-2xl font-bold">{getParticipantCount()}명</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">A팀</dt>
                  <dd className="text-xl font-semibold">{getTeamACount()}명</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">B팀</dt>
                  <dd className="text-xl font-semibold">{getTeamBCount()}명</dd>
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
              <Link href={`/surveys?eventId=${desert.desertSeq}`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  사전조사 관리
                </Button>
              </Link>
              <Link href={`/squads?eventId=${desert.desertSeq}`}>
                <Button variant="outline" className="w-full justify-start">
                  <UserSquare className="h-4 w-4 mr-2" />
                  스쿼드 관리
                </Button>
              </Link>
              <Link href={`/desert-results?eventId=${desert.desertSeq}`}>
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  사막전 결과
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">사막전 설명</TabsTrigger>
          <TabsTrigger value="history">변경 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p>{desert.title} 사막전입니다. 모든 연맹원들의 참여가 필요합니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 text-sm text-muted-foreground">{formatDate(desert.eventDate)}</div>
                  <div>
                    <p className="font-medium">사막전 생성</p>
                    <p className="text-sm text-muted-foreground">관리자에 의해 사막전이 생성되었습니다.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
