"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, CalendarDays, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { fetchFromAPI } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

// 날짜 포맷팅 함수
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}년 ${month}월 ${day}일`
}

// 유저 통계 타입 정의
interface LevelDistribution {
  level: number
  count: number
}

interface UserStats {
  totalUsers: number
  levelDistribution: LevelDistribution[]
  recentJoinUserCount: number
  recentLeftUserCount: number
  recentJoinUsers: {
    userSeq: number
    name: string
    level: number
    power: number
    leave: boolean
    createdAt: string
    updatedAt: string
  }[]
}

// 사막전 통계 타입 정의
interface TeamStats {
  total: number
  played: number
  ratio: number
}

interface DesertRoster {
  desertSeq: number
  desertType: string
  title: string
  team: TeamStats
  reserve: TeamStats
}

interface DesertRate {
  ateamTotal: number
  ateamWinRate: number
  ateamWinCount: number
  bteamWinRate: number
  bteamTotal: number
  bteamWinCount: number
}

interface DesertStats {
  totalDesert: number
  desertRate: DesertRate
  recentRosters: DesertRoster[]
}

export default function Home() {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [desertStats, setDesertStats] = useState<DesertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 병렬로 API 호출
        const [userStatsData, desertStatsData] = await Promise.all([
          fetchFromAPI("/user/stats"),
          fetchFromAPI("/desert/stats"),
        ])

        setUserStats(userStatsData)
        setDesertStats(desertStatsData)
        setError(null)

        console.log('데이터 로드 완료:', {
          totalUsers: userStatsData?.totalUsers,
          totalDesert: desertStatsData?.totalDesert 
        })
      } catch (err) {
        console.error("데이터를 불러오는데 실패했습니다:", err)
        setError("데이터를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 통계 계산
  const stats = {
    totalUsers: userStats?.totalUsers || 0,
    aTeamWins: desertStats?.desertRate?.ateamWinCount || 0,
    bTeamWins: desertStats?.desertRate?.bteamWinCount || 0,
    aTeamWinRate: desertStats?.desertRate?.ateamWinRate || 0,
    bTeamWinRate: desertStats?.desertRate?.bteamWinRate || 0,
    totalDesert: desertStats?.totalDesert || 0,
    newUsersToday: userStats?.recentJoinUserCount || 0,
    withdrawalsToday: userStats?.recentLeftUserCount || 0
  }

  // 에러 표시
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => {
          window.location.reload()
        }}>새로고침</Button>
      </div>
    )
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
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{stats.totalUsers}명</div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span className="text-green-600">가입: +{stats.newUsersToday}명</span>
                  <span className="text-red-600">탈퇴: -{stats.withdrawalsToday}명</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 사막전</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{stats.totalDesert}회</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A팀: {desertStats?.desertRate?.ateamTotal || 0}회 / B팀: {desertStats?.desertRate?.bteamTotal || 0}회
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A팀 승리</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.aTeamWins}회</div>
                <p className="text-xs text-muted-foreground mt-1">승률: {stats.aTeamWinRate.toFixed(1)}%</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">B팀 승리</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.bTeamWins}회</div>
                <p className="text-xs text-muted-foreground mt-1">승률: {stats.bTeamWinRate.toFixed(1)}%</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>최근 이벤트</CardTitle>
              <Button variant="ghost" size="sm" asChild>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사막전</TableHead>
                    <TableHead className="hidden sm:table-cell">팀</TableHead>
                    <TableHead className="hidden sm:table-cell">출전율</TableHead>
                    <TableHead>예비 출전율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-5 w-32" />
                              <div className="sm:hidden mt-1">
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Skeleton className="h-5 w-10" />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-4 w-12 mt-1" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-4 w-12 mt-1" />
                            </TableCell>
                          </TableRow>
                        ))
                    : desertStats?.recentRosters.slice(0, 5).map((roster) => (
                        <TableRow key={`${roster.desertSeq}-${roster.desertType}`}>
                          <TableCell>
                            <div>
                              {roster.title}
                              <div className="sm:hidden text-xs text-muted-foreground">
                                {roster.desertType}팀 | 본대: {roster.team.played}/{roster.team.total}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                roster.desertType === "A" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {roster.desertType}팀
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {roster.team.played}/{roster.team.total}
                              </span>
                              <span className="text-xs text-muted-foreground">{roster.team.ratio.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {roster.reserve.played}/{roster.reserve.total}
                              </span>
                              <span className="text-xs text-muted-foreground">{roster.reserve.ratio.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {userStats?.levelDistribution
                  .sort((a, b) => b.level - a.level)
                  .map((item) => {
                    const percentage = (item.count / (userStats?.totalUsers || 1)) * 100
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 가입 유저 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>최근 가입 유저</CardTitle>
            <Button variant="ghost" size="sm" asChild>
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
                {loading
                  ? [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-5 w-8" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-5 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                      </TableRow>
                    ))
                  : userStats?.recentJoinUsers.map((user) => (
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
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
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
