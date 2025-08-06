"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Users, AlertCircle, Activity, Clock, UserCheck } from 'lucide-react'
import { 
  monitoringAPI, 
  monitoringUtils, 
  type ActiveUsersResponse, 
  type UserMonitoringInfo 
} from '@/lib/monitoring-api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ActiveUsersMonitor')

interface ActiveUsersMonitorProps {
  autoRefresh?: boolean
  refreshInterval?: number // 밀리초
  showDetailedView?: boolean
}

export function ActiveUsersMonitor({ 
  autoRefresh = true, 
  refreshInterval = 30000, // 30초
  showDetailedView = false 
}: ActiveUsersMonitorProps) {
  const { data: session } = useSession()
  const [activeUsers, setActiveUsers] = useState<ActiveUsersResponse | null>(null)
  const [detailedUsers, setDetailedUsers] = useState<UserMonitoringInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 관리자 권한 확인
  const isMaster = session?.user?.role === 'MASTER'

  // 활성 사용자 수 조회
  const fetchActiveUsers = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else if (!activeUsers) {
        setLoading(true)
      }
      
      setError(null)
      
      const data = await monitoringAPI.getActiveUsers()
      setActiveUsers(data)
      setLastUpdated(new Date())
      
      logger.debug('활성 사용자 수 업데이트 완료:', data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '활성 사용자 조회 실패'
      setError(errorMessage)
      logger.error('활성 사용자 조회 실패:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // 상세 사용자 정보 조회 (관리자용)
  const fetchDetailedUsers = async () => {
    if (!isMaster) return
    
    try {
      const data = await monitoringAPI.getActiveUsersDetail()
      setDetailedUsers(data)
      logger.debug('상세 사용자 정보 업데이트 완료:', data.length, '명')
    } catch (err) {
      logger.error('상세 사용자 정보 조회 실패:', err)
    }
  }

  // 수동 새로고침
  const handleRefresh = async () => {
    await Promise.all([
      fetchActiveUsers(true),
      showDetailedView && isMaster ? fetchDetailedUsers() : Promise.resolve()
    ])
  }

  // 초기 로드 및 자동 새로고침 설정
  useEffect(() => {
    fetchActiveUsers()
    
    if (showDetailedView && isMaster) {
      fetchDetailedUsers()
    }
  }, [showDetailedView, isMaster])

  // 자동 새로고침 인터벌 설정
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchActiveUsers()
      if (showDetailedView && isMaster) {
        fetchDetailedUsers()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, showDetailedView, isMaster])

  // 로딩 상태
  if (loading || !activeUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            실시간 활성 사용자
          </CardTitle>
          <CardDescription>현재 접속 중인 사용자 현황</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-primary">-</div>
              <div className="text-sm text-muted-foreground">총 접속자</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">-</div>
              <div className="text-sm text-muted-foreground">활성 테넌트</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">- 분</div>
              <div className="text-sm text-muted-foreground">세션 타임아웃</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 에러 상태
  if (error && !activeUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            실시간 활성 사용자
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 메인 통계 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                실시간 활성 사용자
              </CardTitle>
              <CardDescription>현재 접속 중인 사용자 현황</CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeUsers && (
            <div className="space-y-6">
              {/* 전체 통계 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {activeUsers?.totalActiveUsers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">총 접속자</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {Object.keys(activeUsers?.activeUsersByTenant || {}).length}
                  </div>
                  <div className="text-sm text-muted-foreground">활성 테넌트</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor((activeUsers?.systemInfo?.sessionTimeout || 30) / 60)}분
                  </div>
                  <div className="text-sm text-muted-foreground">세션 타임아웃</div>
                </div>
              </div>

              {/* 테넌트별 통계 */}
              {Object.keys(activeUsers?.activeUsersByTenant || {}).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    테넌트별 접속 현황
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(activeUsers?.activeUsersByTenant || {}).map(([tenantId, userCount]) => (
                      <div key={tenantId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">테넌트 {tenantId}</div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {userCount}명
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 마지막 업데이트 시간 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
                </div>
                {autoRefresh && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    자동 새로고침 중
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 사용자 목록 (관리자용) */}
      {showDetailedView && isMaster && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              상세 사용자 정보
            </CardTitle>
            <CardDescription>
              현재 접속 중인 사용자들의 상세 정보 (관리자 전용)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailedUsers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>닉네임</TableHead>
                      <TableHead>테넌트</TableHead>
                      <TableHead>로그인 시간</TableHead>
                      <TableHead>최근 활동</TableHead>
                      <TableHead>세션 상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedUsers.map((user, index) => (
                      <TableRow key={`${user.userId}-${user.sessionId}`}>
                        <TableCell className="font-medium">
                          {monitoringUtils.formatNickname(user.nickname)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.serverAllianceId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {monitoringUtils.formatLoginTime(user.loginTime)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {monitoringUtils.formatLastActivity(user.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              monitoringUtils.calculateSessionTimeLeft(
                                user.lastActivity, 
                                activeUsers?.systemInfo.sessionTimeout || 30
                              ) === '만료됨' ? 'destructive' : 'secondary'
                            }
                          >
                            {monitoringUtils.calculateSessionTimeLeft(
                              user.lastActivity, 
                              activeUsers?.systemInfo.sessionTimeout || 30
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                현재 접속 중인 사용자가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 관리자가 아닌 경우 알림 */}
      {showDetailedView && !isMaster && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            상세 사용자 정보는 관리자만 볼 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 에러 알림 (부분적 에러) */}
      {error && activeUsers && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            일부 데이터 조회 중 오류가 발생했습니다: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// 간단한 활성 사용자 수만 표시하는 컴포넌트
export function SimpleActiveUsersCounter() {
  const [activeUsers, setActiveUsers] = useState<ActiveUsersResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await monitoringAPI.getActiveUsers()
        setActiveUsers(data)
      } catch (error) {
        logger.error('간단 활성 사용자 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // 1분마다 자동 업데이트
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <Skeleton className="h-6 w-16" />
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Users className="h-3 w-3" />
      {activeUsers?.totalActiveUsers || 0}명 접속중
    </Badge>
  )
}