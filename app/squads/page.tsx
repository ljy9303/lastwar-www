"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowLeft, Save, AlertTriangle } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

// 임시 유저 데이터 (사전조사 데이터에서 가져온 것으로 가정)
const initialUsers = [
  { id: 1, nickname: "용사1", level: 30, power: 1500000, isLeft: false, preference: "A_TEAM" },
  { id: 2, nickname: "용사2", level: 28, power: 1350000, isLeft: false, preference: "B_TEAM" },
  { id: 3, nickname: "용사3", level: 32, power: 1650000, isLeft: true, preference: "AB_POSSIBLE" },
  { id: 4, nickname: "용사4", level: 25, power: 1200000, isLeft: false, preference: "A_RESERVE" },
  { id: 5, nickname: "용사5", level: 35, power: 1800000, isLeft: false, preference: "B_RESERVE" },
]

// 팀 상수
const TEAM = {
  A_TEAM: "A_TEAM",
  B_TEAM: "B_TEAM",
  RESERVE_A: "RESERVE_A",
  RESERVE_B: "RESERVE_B",
  UNASSIGNED: "UNASSIGNED",
  EXCLUDED: "EXCLUDED",
}

// 임시 이벤트 데이터
const events = [
  { id: "1", name: "4월 4주차 사막전" },
  { id: "2", name: "5월 1주차 사막전" },
]

export default function SquadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const eventId = searchParams.get("eventId")

  const [users] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // 팀 배정 상태
  const [squads, setSquads] = useState({
    [TEAM.A_TEAM]: [],
    [TEAM.B_TEAM]: [],
    [TEAM.RESERVE_A]: [],
    [TEAM.RESERVE_B]: [],
    [TEAM.UNASSIGNED]: [],
    [TEAM.EXCLUDED]: [],
  })

  // 이벤트 ID가 있으면 해당 이벤트 선택
  useEffect(() => {
    if (eventId) {
      const event = events.find((e) => e.id === eventId)
      if (event) {
        setSelectedEvent(event)
      }
    }
  }, [eventId])

  // 초기 데이터 로드
  useEffect(() => {
    // 사전조사 데이터 기반으로 초기 배정
    const initialSquads = {
      [TEAM.A_TEAM]: [],
      [TEAM.B_TEAM]: [],
      [TEAM.RESERVE_A]: [],
      [TEAM.RESERVE_B]: [],
      [TEAM.UNASSIGNED]: [],
      [TEAM.EXCLUDED]: [],
    }

    // 사전조사 기반 배정
    users.forEach((user) => {
      switch (user.preference) {
        case "A_TEAM":
          initialSquads[TEAM.A_TEAM].push(user)
          break
        case "B_TEAM":
          initialSquads[TEAM.B_TEAM].push(user)
          break
        case "A_RESERVE":
          initialSquads[TEAM.RESERVE_A].push(user)
          break
        case "B_RESERVE":
          initialSquads[TEAM.RESERVE_B].push(user)
          break
        case "AB_POSSIBLE":
          initialSquads[TEAM.UNASSIGNED].push(user)
          break
        case "NONE":
          initialSquads[TEAM.EXCLUDED].push(user)
          break
        default:
          initialSquads[TEAM.UNASSIGNED].push(user)
      }
    })

    setSquads(initialSquads)
  }, [users])

  // 팀 이름 표시
  const getTeamName = (team) => {
    switch (team) {
      case TEAM.A_TEAM:
        return "A팀"
      case TEAM.B_TEAM:
        return "B팀"
      case TEAM.RESERVE_A:
        return "A팀 예비"
      case TEAM.RESERVE_B:
        return "B팀 예비"
      case TEAM.UNASSIGNED:
        return "미배정"
      case TEAM.EXCLUDED:
        return "제외"
      default:
        return team
    }
  }

  // 선호도 표시
  const getPreferenceLabel = (preference) => {
    switch (preference) {
      case "A_TEAM":
        return "A팀"
      case "B_TEAM":
        return "B팀"
      case "A_RESERVE":
        return "A팀 예비"
      case "B_RESERVE":
        return "B팀 예비"
      case "AB_POSSIBLE":
        return "AB 가능"
      case "AB_IMPOSSIBLE":
        return "AB 불가능"
      case "NONE":
        return "미참여"
      default:
        return preference
    }
  }

  // 유저 이동 함수
  const moveUser = (userId, fromTeam, toTeam) => {
    if (isConfirmed) {
      alert("이미 확정된 팀은 수정할 수 없습니다.")
      return
    }

    // 주전 인원 제한 체크
    if (
      (toTeam === TEAM.A_TEAM && squads[TEAM.A_TEAM].length >= 20) ||
      (toTeam === TEAM.B_TEAM && squads[TEAM.B_TEAM].length >= 20)
    ) {
      alert("주전 인원은 20명을 초과할 수 없습니다.")
      return
    }

    // 예비 인원 제한 체크
    if (
      (toTeam === TEAM.RESERVE_A && squads[TEAM.RESERVE_A].length >= 10) ||
      (toTeam === TEAM.RESERVE_B && squads[TEAM.RESERVE_B].length >= 10)
    ) {
      alert("예비 인원은 10명을 초과할 수 없습니다.")
      return
    }

    const newSquads = { ...squads }
    const userIndex = newSquads[fromTeam].findIndex((u) => u.id === userId)

    if (userIndex !== -1) {
      const user = newSquads[fromTeam][userIndex]
      newSquads[fromTeam].splice(userIndex, 1)
      newSquads[toTeam].push(user)
      setSquads(newSquads)
    }
  }

  // 팀 확정 함수
  const confirmSquads = () => {
    setIsConfirmed(true)
    // 여기에 확정 정보 저장 로직 추가
  }

  // 필터링된 유저 목록
  const getFilteredUsers = (team) => {
    return squads[team].filter((user) => user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // 유저 카드 렌더링
  const renderUserCard = (user, team) => {
    const isPreferenceMatched =
      (team === TEAM.A_TEAM && user.preference === "A_TEAM") ||
      (team === TEAM.B_TEAM && user.preference === "B_TEAM") ||
      (team === TEAM.RESERVE_A && user.preference === "A_RESERVE") ||
      (team === TEAM.RESERVE_B && user.preference === "B_RESERVE")

    return (
      <div
        key={user.id}
        className={`p-3 mb-2 rounded-lg border ${isPreferenceMatched ? "bg-green-50 border-green-200" : "bg-background"}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{user.nickname}</div>
            <div className="text-sm text-muted-foreground">
              Lv.{user.level} | {user.power.toLocaleString()}
            </div>
            <Badge variant={isPreferenceMatched ? "outline" : "secondary"} className="mt-1">
              {getPreferenceLabel(user.preference)}
            </Badge>
          </div>

          {!isConfirmed && (
            <div className="flex flex-col gap-1">
              {team !== TEAM.A_TEAM && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => moveUser(user.id, team, TEAM.A_TEAM)}
                >
                  A팀
                </Button>
              )}

              {team !== TEAM.B_TEAM && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => moveUser(user.id, team, TEAM.B_TEAM)}
                >
                  B팀
                </Button>
              )}

              {team !== TEAM.RESERVE_A && team !== TEAM.RESERVE_B && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => moveUser(user.id, team, team === TEAM.A_TEAM ? TEAM.RESERVE_A : TEAM.RESERVE_B)}
                >
                  예비
                </Button>
              )}

              {team !== TEAM.EXCLUDED && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-destructive"
                  onClick={() => moveUser(user.id, team, TEAM.EXCLUDED)}
                >
                  제외
                </Button>
              )}
            </div>
          )}
        </div>
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
        <h1 className="text-3xl font-bold">스쿼드 관리 {selectedEvent && `- ${selectedEvent.name}`}</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="닉네임으로 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isConfirmed}>
              <Save className="mr-2 h-4 w-4" />
              {isConfirmed ? "확정됨" : "팀 확정"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>팀 확정</AlertDialogTitle>
              <AlertDialogDescription>팀을 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSquads}>확정</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isConfirmed && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>팀이 확정되었습니다. 더 이상 수정할 수 없습니다.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>A팀 ({squads[TEAM.A_TEAM].length}/20)</CardTitle>
              {squads[TEAM.A_TEAM].length > 20 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>A팀 주전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.A_TEAM).length > 0 ? (
              getFilteredUsers(TEAM.A_TEAM).map((user) => renderUserCard(user, TEAM.A_TEAM))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* B팀 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>B팀 ({squads[TEAM.B_TEAM].length}/20)</CardTitle>
              {squads[TEAM.B_TEAM].length > 20 && <Badge variant="destructive">초과</Badge>}
            </div>
            <CardDescription>B팀 주전 멤버</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {getFilteredUsers(TEAM.B_TEAM).length > 0 ? (
              getFilteredUsers(TEAM.B_TEAM).map((user) => renderUserCard(user, TEAM.B_TEAM))
            ) : (
              <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* 예비 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>예비 인원</CardTitle>
            <CardDescription>A팀/B팀 예비 인원</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={TEAM.RESERVE_A}>
              <TabsList className="mb-4">
                <TabsTrigger value={TEAM.RESERVE_A}>A팀 예비 ({squads[TEAM.RESERVE_A].length}/10)</TabsTrigger>
                <TabsTrigger value={TEAM.RESERVE_B}>B팀 예비 ({squads[TEAM.RESERVE_B].length}/10)</TabsTrigger>
              </TabsList>

              <TabsContent value={TEAM.RESERVE_A} className="max-h-[300px] overflow-y-auto">
                {getFilteredUsers(TEAM.RESERVE_A).length > 0 ? (
                  getFilteredUsers(TEAM.RESERVE_A).map((user) => renderUserCard(user, TEAM.RESERVE_A))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
                )}
              </TabsContent>

              <TabsContent value={TEAM.RESERVE_B} className="max-h-[300px] overflow-y-auto">
                {getFilteredUsers(TEAM.RESERVE_B).length > 0 ? (
                  getFilteredUsers(TEAM.RESERVE_B).map((user) => renderUserCard(user, TEAM.RESERVE_B))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">배정된 유저가 없습니다.</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 미배정 & 제외 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>기타 인원</CardTitle>
            <CardDescription>미배정 및 제외 인원</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={TEAM.UNASSIGNED}>
              <TabsList className="mb-4">
                <TabsTrigger value={TEAM.UNASSIGNED}>미배정 ({squads[TEAM.UNASSIGNED].length})</TabsTrigger>
                <TabsTrigger value={TEAM.EXCLUDED}>제외 ({squads[TEAM.EXCLUDED].length})</TabsTrigger>
              </TabsList>

              <TabsContent value={TEAM.UNASSIGNED} className="max-h-[300px] overflow-y-auto">
                {getFilteredUsers(TEAM.UNASSIGNED).length > 0 ? (
                  getFilteredUsers(TEAM.UNASSIGNED).map((user) => renderUserCard(user, TEAM.UNASSIGNED))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">미배정 유저가 없습니다.</div>
                )}
              </TabsContent>

              <TabsContent value={TEAM.EXCLUDED} className="max-h-[300px] overflow-y-auto">
                {getFilteredUsers(TEAM.EXCLUDED).length > 0 ? (
                  getFilteredUsers(TEAM.EXCLUDED).map((user) => renderUserCard(user, TEAM.EXCLUDED))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">제외된 유저가 없습니다.</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
