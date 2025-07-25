"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Shield, RotateCcw, AlertTriangle, Clock, User, Database, Calendar, ChevronRight, Loader2 } from "lucide-react"
import { useIsAdmin } from "@/lib/auth-utils"
import {
  revertSingleAction,
  revertByServerAndTimeRange,
  countRevertibleActions,
  getRecentActions,
  getServerAlliances,
  getActionLogs,
  type RollbackResponse,
  type RecentActionsResponse,
  type RollbackTimeRangeRequest,
  type UserActionLog
} from "@/lib/api-service"

// 타입 정의
interface ActionLog {
  id: number
  userSeq: number
  userName: string
  targetTable: string
  targetId: number
  actionType: string
  businessAction: string
  description: string
  serverAllianceId: number
  createdAt: string
  isReverted: boolean
  revertedBy: number | null
  revertedAt: string | null
  revertReason: string | null
  revertBatchId: string | null
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const { toast } = useToast()

  // 상태 관리
  const [recentActions, setRecentActions] = useState<RecentActionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 서버 연맹 관련 상태
  const [serverAlliances, setServerAlliances] = useState<Array<{
    serverAllianceId: number, 
    serverInfo: number,
    allianceTag: string,
    actionCount: number, 
    lastActionTime: string
  }>>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  
  // 액션 로그 관련 상태
  const [actionLogs, setActionLogs] = useState<UserActionLog[]>([])
  const [actionLogsLoading, setActionLogsLoading] = useState(false)
  
  // 단일 롤백 상태
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)
  const [singleRollbackReason, setSingleRollbackReason] = useState('')
  const [singleRollbackLoading, setSingleRollbackLoading] = useState(false)
  
  // 시간 범위 롤백 상태
  const [timeRangeForm, setTimeRangeForm] = useState({
    serverAllianceId: null as number | null,
    startTime: '',
    endTime: '',
    reason: ''
  })
  const [timeRangeLoading, setTimeRangeLoading] = useState(false)
  const [revertibleCount, setRevertibleCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)

  // Admin 권한 체크
  useEffect(() => {
    if (status === 'loading') return

    if (!session || !isAdmin) {
      toast({
        variant: "destructive",
        title: "접근 거부",
        description: "관리자만 접근할 수 있는 페이지입니다."
      })
      router.push('/')
      return
    }
  }, [session, status, isAdmin, router, toast])

  // 초기 데이터 로드
  useEffect(() => {
    if (isAdmin) {
      loadInitialData()
    }
  }, [isAdmin])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // 서버 연맹 목록과 현재 사용자의 최근 액션 정보를 동시에 로드
      const [serverAlliancesData, recentActionsData] = await Promise.all([
        getServerAlliances(),
        getRecentActions()
      ])
      
      setServerAlliances(serverAlliancesData)
      setRecentActions(recentActionsData)
      
      // 기본값으로 현재 사용자의 서버 설정
      const currentServerId = recentActionsData.serverAllianceId
      setSelectedServerId(currentServerId)
      
      // 기본 시간 범위 설정 (최근 1시간)
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - 60 * 60 * 1000) // 1시간 전
      setTimeRangeForm({
        serverAllianceId: currentServerId,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16),
        reason: '관리자 시간 범위 롤백'
      })
      
      // 기본 서버의 액션 로그 로드
      loadActionLogs(currentServerId)
      
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error)
      toast({
        variant: "destructive",
        title: "데이터 로드 실패",
        description: "초기 데이터를 불러올 수 없습니다."
      })
    } finally {
      setLoading(false)
    }
  }

  const loadActionLogs = async (serverId: number) => {
    try {
      setActionLogsLoading(true)
      const logs = await getActionLogs(serverId, 0, 20)
      setActionLogs(logs)
    } catch (error) {
      console.error('액션 로그 로드 실패:', error)
      toast({
        variant: "destructive",
        title: "액션 로그 로드 실패",
        description: "액션 로그를 불러올 수 없습니다."
      })
    } finally {
      setActionLogsLoading(false)
    }
  }

  const handleSingleRollback = async () => {
    if (!selectedActionId) {
      toast({
        variant: "destructive",
        title: "선택 오류",
        description: "롤백할 액션을 선택해주세요."
      })
      return
    }

    try {
      setSingleRollbackLoading(true)
      const response = await revertSingleAction(
        selectedActionId,
        singleRollbackReason || '관리자 단일 롤백'
      )

      if (response.success) {
        toast({
          title: "롤백 성공",
          description: `액션 ID ${selectedActionId}가 성공적으로 롤백되었습니다.`
        })
        setSelectedActionId(null)
        setSingleRollbackReason('')
        
        // 데이터 새로고침
        if (selectedServerId) {
          await loadActionLogs(selectedServerId)
        }
      } else {
        toast({
          variant: "destructive",
          title: "롤백 실패",
          description: response.message
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "롤백 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다."
      })
    } finally {
      setSingleRollbackLoading(false)
    }
  }

  const handleCountCheck = async () => {
    if (!timeRangeForm.startTime || !timeRangeForm.endTime || !timeRangeForm.serverAllianceId) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "서버, 시작 시간, 종료 시간을 모두 입력해주세요."
      })
      return
    }

    try {
      setCountLoading(true)
      const response = await countRevertibleActions({
        serverAllianceId: timeRangeForm.serverAllianceId,
        startTime: timeRangeForm.startTime,
        endTime: timeRangeForm.endTime
      })
      setRevertibleCount(response.revertibleCount)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "조회 실패",
        description: error.message || "되돌리기 가능한 액션 수를 조회할 수 없습니다."
      })
    } finally {
      setCountLoading(false)
    }
  }

  const handleTimeRangeRollback = async () => {
    if (!timeRangeForm.startTime || !timeRangeForm.endTime || !timeRangeForm.serverAllianceId) {
      toast({
        variant: "destructive",
        title: "입력 오류",
        description: "모든 필드를 입력해주세요."
      })
      return
    }

    try {
      setTimeRangeLoading(true)
      const request: RollbackTimeRangeRequest = {
        serverAllianceId: timeRangeForm.serverAllianceId,
        startTime: timeRangeForm.startTime,
        endTime: timeRangeForm.endTime,
        reason: timeRangeForm.reason || '관리자 시간 범위 롤백'
      }

      const response = await revertByServerAndTimeRange(request)

      if (response.success) {
        toast({
          title: "시간 범위 롤백 성공",
          description: `${response.revertedCount}개의 액션이 성공적으로 롤백되었습니다.`
        })
        
        // 데이터 새로고침
        if (selectedServerId) {
          await loadActionLogs(selectedServerId)
        }
        setRevertibleCount(null) // 카운트 초기화
      } else {
        toast({
          variant: "destructive",
          title: "롤백 실패",
          description: response.message
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "롤백 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다."
      })
    } finally {
      setTimeRangeLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // 리다이렉트 처리 중
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">시스템 관리</h1>
          <p className="text-muted-foreground">관리자 전용 시스템 관리 도구</p>
        </div>
      </div>

      {/* 관리 메뉴 */}
      <Card>
        <CardHeader>
          <CardTitle>관리 메뉴</CardTitle>
          <CardDescription>시스템 관리 기능에 빠르게 접근할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => router.push('/admin/accounts')}
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">계정 관리</div>
                  <div className="text-sm text-muted-foreground">사용자 라벨 관리</div>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 서버 정보 */}
      {serverAlliances.length > 0 && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            등록된 서버: <strong>{serverAlliances.length}개</strong> | 
            현재 선택된 서버: <strong>
              {selectedServerId ? 
                (() => {
                  const server = serverAlliances.find(s => s.serverAllianceId === selectedServerId)
                  return server ? `${server.serverInfo} / ${server.allianceTag}` : selectedServerId
                })()
                : '미선택'
              }
            </strong> |
            {selectedServerId && actionLogs.length > 0 && (
              <span> 롤백 가능한 액션: <strong>{actionLogs.length}개+</strong></span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 단일 액션 롤백 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              단일 액션 롤백
            </CardTitle>
            <CardDescription>
              특정 액션 로그 ID를 지정하여 개별 롤백을 수행합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverSelect">서버 선택</Label>
              <Select 
                value={selectedServerId?.toString() || ""} 
                onValueChange={(value) => {
                  const serverId = parseInt(value)
                  setSelectedServerId(serverId)
                  loadActionLogs(serverId)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="서버를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {serverAlliances.map((server) => (
                    <SelectItem key={server.serverAllianceId} value={server.serverAllianceId.toString()}>
                      {server.serverInfo} / {server.allianceTag} ({server.actionCount}개 액션)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionSelect">롤백할 액션 선택</Label>
              <Select 
                value={selectedActionId?.toString() || ""} 
                onValueChange={(value) => setSelectedActionId(parseInt(value))}
                disabled={actionLogsLoading || actionLogs.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    actionLogsLoading ? "로딩 중..." : 
                    actionLogs.length === 0 ? "액션이 없습니다" :
                    "롤백할 액션을 선택하세요"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {actionLogs.map((action) => (
                    <SelectItem key={action.id} value={action.id.toString()}>
                      ID: {action.id} | {action.businessAction} | {action.targetTable} | {new Date(action.createdAt).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="singleReason">롤백 사유 (선택사항)</Label>
              <Input
                id="singleReason"
                placeholder="예: 실수로 인한 데이터 수정"
                value={singleRollbackReason}
                onChange={(e) => setSingleRollbackReason(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSingleRollback}
              disabled={singleRollbackLoading}
              className="w-full"
            >
              {singleRollbackLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  롤백 중...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  단일 롤백 실행
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 시간 범위 롤백 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              시간 범위 롤백
            </CardTitle>
            <CardDescription>
              특정 시간 범위 내의 모든 액션을 일괄 롤백합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeRangeServerSelect">서버 선택</Label>
              <Select 
                value={timeRangeForm.serverAllianceId?.toString() || ""} 
                onValueChange={(value) => {
                  const serverId = parseInt(value)
                  setTimeRangeForm(prev => ({ ...prev, serverAllianceId: serverId }))
                  setRevertibleCount(null) // 서버 변경 시 카운트 초기화
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="서버를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {serverAlliances.map((server) => (
                    <SelectItem key={server.serverAllianceId} value={server.serverAllianceId.toString()}>
                      {server.serverInfo} / {server.allianceTag} ({server.actionCount}개 액션)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={timeRangeForm.startTime}
                  onChange={(e) => setTimeRangeForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={timeRangeForm.endTime}
                  onChange={(e) => setTimeRangeForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeRangeReason">롤백 사유</Label>
              <Textarea
                id="timeRangeReason"
                placeholder="예: 서버 오류로 인한 대량 데이터 복구"
                value={timeRangeForm.reason}
                onChange={(e) => setTimeRangeForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={2}
              />
            </div>
            
            {/* 개수 확인 */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleCountCheck}
                disabled={countLoading}
                className="flex-1"
              >
                {countLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    개수 확인
                  </>
                )}
              </Button>
              {revertibleCount !== null && (
                <Badge variant={revertibleCount > 0 ? "destructive" : "secondary"}>
                  {revertibleCount}개
                </Badge>
              )}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={timeRangeLoading || revertibleCount === null || revertibleCount === 0}
                >
                  {timeRangeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      롤백 중...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      시간 범위 롤백 실행
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    시간 범위 롤백 확인
                  </DialogTitle>
                  <DialogDescription>
                    이 작업은 되돌릴 수 없습니다. 정말로 {revertibleCount}개의 액션을 롤백하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <p><strong>시작 시간:</strong> {timeRangeForm.startTime}</p>
                  <p><strong>종료 시간:</strong> {timeRangeForm.endTime}</p>
                  <p><strong>롤백 사유:</strong> {timeRangeForm.reason}</p>
                  <p><strong>대상 액션 수:</strong> {revertibleCount}개</p>
                </div>
                <DialogFooter>
                  <Button variant="outline">취소</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleTimeRangeRollback}
                    disabled={timeRangeLoading}
                  >
                    {timeRangeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        롤백 중...
                      </>
                    ) : (
                      '확인'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 사용 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 가이드</CardTitle>
          <CardDescription>
            사용자 액션 롤백 시스템 사용 방법
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">1</Badge>
              <div>
                <h4 className="font-medium">단일 액션 롤백</h4>
                <p className="text-sm text-muted-foreground">
                  특정 액션 로그 ID를 입력하여 개별 작업을 되돌립니다. 
                  로그 ID는 개발자 도구나 데이터베이스에서 확인할 수 있습니다.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge variant="secondary">2</Badge>
              <div>
                <h4 className="font-medium">시간 범위 롤백</h4>
                <p className="text-sm text-muted-foreground">
                  지정된 시간 범위 내의 모든 액션을 일괄적으로 되돌립니다. 
                  먼저 "개수 확인" 버튼으로 대상 액션 수를 확인한 후 실행하세요.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Badge variant="destructive">⚠️</Badge>
              <div>
                <h4 className="font-medium text-destructive">주의사항</h4>
                <p className="text-sm text-muted-foreground">
                  롤백 작업은 되돌릴 수 없습니다. 실행 전 반드시 대상 데이터를 확인하고, 
                  중요한 작업은 데이터베이스 백업 후 실행하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}