"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, History, CheckCircle, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// 전투력 포맷팅 함수 (1 = 1백만)
const formatPower = (power: number): string => {
  if (power === 0) return "0"
  if (power < 1) {
    return `${(power * 100).toFixed(0)}만`
  }
  if (power >= 1000) {
    return `${(power / 1000).toFixed(1)}B`
  }
  if (power >= 100) {
    return `${power.toFixed(0)}M`
  }
  return `${power.toFixed(1)}M`
}

// 임시 이벤트 데이터
// 이거 기준
const initialEvents = [
  {
    id: 1,
    name: "4월 4주차 사막전",
    date: "2023-04-22",
    status: "completed",
    participants: 45,
    aTeam: 20,
    bTeam: 20,
    winner: "A_TEAM",
  },
  {
    id: 2,
    name: "5월 1주차 사막전",
    date: "2023-05-01",
    status: "in_progress",
    participants: 42,
    aTeam: 20,
    bTeam: 18,
    winner: null,
  },
]

// 임시 유저 데이터
const initialUsers = [
  { id: 1, nickname: "용사1", level: 30, power: 1500, isLeft: false, participation: 10 },
  { id: 2, nickname: "용사2", level: 28, power: 1350, isLeft: false, participation: 8 },
  { id: 3, nickname: "용사3", level: 32, power: 1650, isLeft: true, participation: 5 },
  { id: 4, nickname: "용사4", level: 25, power: 1200, isLeft: false, participation: 9 },
  { id: 5, nickname: "용사5", level: 35, power: 1800, isLeft: false, participation: 10 },
]

// 임시 활동 로그
const initialLogs = [
  { id: 1, date: "2023-05-01", action: "이벤트 생성", details: "5월 1주차 사막전 생성됨" },
  { id: 2, date: "2023-04-28", action: "팀 확정", details: "4월 4주차 사막전 팀 확정" },
  { id: 3, date: "2023-04-26", action: "사전조사 완료", details: "4월 4주차 사막전 사전조사 완료" },
]

// 유저 통계 데이터
const userStats = {
  totalUsers: 91,
  levelDistribution: [
    {
      level: 30,
      count: 38,
    },
    {
      level: 29,
      count: 26,
    },
    {
      level: 28,
      count: 11,
    },
    {
      level: 27,
      count: 11,
    },
    {
      level: 26,
      count: 1,
    },
    {
      level: 25,
      count: 3,
    },
    {
      level: 24,
      count: 1,
    },
  ],
  recentJoinUserCount: 2,
  recentLeftUserCount: 4,
  recentJoinUsers: [
    {
      userSeq: 155,
      name: "BlackRose3",
      level: 29,
      power: 58.7,
      leave: false,
      createdAt: "2025-05-27T06:30:06.118+00:00",
      updatedAt: "2025-05-27T06:30:06.118+00:00",
    },
    {
      userSeq: 154,
      name: "HEDGEHOG",
      level: 27,
      power: 35.9,
      leave: false,
      createdAt: "2025-05-27T06:29:22.560+00:00",
      updatedAt: "2025-05-27T06:29:22.560+00:00",
    },
    {
      userSeq: 152,
      name: "Clayymoree",
      level: 28,
      power: 54.0,
      leave: false,
      createdAt: "2025-05-14T08:55:55.463+00:00",
      updatedAt: "2025-05-14T08:55:55.463+00:00",
    },
  ],
}

export default function DashboardPage() {
  const [events] = useState(initialEvents)
  const [users] = useState(initialUsers)
  const [logs] = useState(initialLogs)

  // 통계 계산
  const stats = {
    totalUsers: userStats.totalUsers,
    totalEvents: events.length,
    completedEvents: events.filter((e) => e.status === "completed").length,
    aTeamWins: events.filter((e) => e.winner === "A_TEAM").length,
    bTeamWins: events.filter((e) => e.winner === "B_TEAM").length,
    newUsersToday: userStats.recentJoinUserCount,
    withdrawalsToday: userStats.recentLeftUserCount,
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 유저</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}명</div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span className="text-green-600">가입: +{stats.newUsersToday}명</span>
              <span className="text-red-600">탈퇴: -{stats.withdrawalsToday}명</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">이벤트 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{stats.totalEvents}개</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              완료: {stats.completedEvents}개 / 진행중: {stats.totalEvents - stats.completedEvents}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A팀 승리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aTeamWins}회</div>
            <p className="text-xs text-muted-foreground mt-1">
              승률: {stats.completedEvents > 0 ? Math.round((stats.aTeamWins / stats.completedEvents) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">B팀 승리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bTeamWins}회</div>
            <p className="text-xs text-muted-foreground mt-1">
              승률: {stats.completedEvents > 0 ? Math.round((stats.bTeamWins / stats.completedEvents) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>최근 이벤트</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">모두 보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이벤트명</TableHead>
                    <TableHead className="hidden sm:table-cell">날짜</TableHead>
                    <TableHead className="hidden sm:table-cell">참가자</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Link href={`/events/${event.id}`} className="hover:underline">
                          <div>
                            {event.name}
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {event.date} | {event.participants}명
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{event.date}</TableCell>
                      <TableCell className="hidden sm:table-cell">{event.participants}명</TableCell>
                      <TableCell>
                        {event.status === "completed" ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            완료
                          </span>
                        ) : (
                          <span className="text-blue-600">진행중</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>최근 활동</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="rounded-full p-2 bg-muted">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <p className="text-xs text-muted-foreground">{log.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 유저 통계 섹션 */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* 레벨 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>레벨 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.levelDistribution
                .sort((a, b) => b.level - a.level)
                .map((item) => {
                  const percentage = (item.count / userStats.totalUsers) * 100
                  return (
                    <div key={item.level} className="flex items-center justify-between">
                      <span className="text-sm font-medium">레벨 {item.level}</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{item.count}명</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 유저 활동 통계 */}
      <div className="grid grid-cols-1 gap-6 mb-6"></div>

      {/* 최근 가입 유저 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>최근 가입 유저</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">모두 보기</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>닉네임</TableHead>
                  <TableHead className="hidden sm:table-cell">레벨</TableHead>
                  <TableHead className="hidden sm:table-cell">전투력</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.recentJoinUsers.map((user) => (
                  <TableRow key={user.userSeq}>
                    <TableCell>
                      <div>
                        {user.name}
                        <div className="sm:hidden text-xs text-muted-foreground">
                          Lv.{user.level} | {formatPower(user.power)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.level}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatPower(user.power)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
