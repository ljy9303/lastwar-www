"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authAPI, authStorage } from '@/lib/auth-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SessionInfo {
  sessionId: string
  userId: number
  createdAt: string
  expiresAt: string
  isValid: boolean
}

export default function AuthTestPage() {
  const { user, isAuthenticated, isMaster, isRegistrationComplete, refreshUser } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessionInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await authAPI.getSessionInfo()
      setSessionInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 정보 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessionInfo()
    }
  }, [isAuthenticated])

  const handleRefresh = async () => {
    await refreshUser()
    await fetchSessionInfo()
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              인증되지 않음
            </CardTitle>
            <CardDescription>
              이 페이지에 접근하려면 로그인이 필요합니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">OAuth 인증 테스트</h1>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 인증 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            인증 상태
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">인증 여부</label>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "인증됨" : "미인증"}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">권한 레벨</label>
              <Badge variant={isMaster ? "default" : "secondary"}>
                {isMaster ? "마스터" : "일반 사용자"}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">가입 완료</label>
              <Badge variant={isRegistrationComplete ? "default" : "destructive"}>
                {isRegistrationComplete ? "완료" : "미완료"}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">세션 ID</label>
              <code className="text-xs bg-muted p-1 rounded block truncate">
                {authStorage.getSessionId()?.substring(0, 8)}...
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 정보 */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>사용자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">사용자 ID</label>
                  <p className="text-sm font-mono">{user.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">카카오 ID</label>
                  <p className="text-sm font-mono">{user.kakaoId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">이메일</label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">닉네임</label>
                  <p className="text-sm font-semibold">{user.nickname}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">서버 정보</label>
                  <p className="text-sm">{user.serverInfo ? `${user.serverInfo}서버` : '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">연맹 태그</label>
                  <p className="text-sm font-mono">{user.allianceTag || '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">역할</label>
                  <p className="text-sm">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">상태</label>
                  <p className="text-sm">{user.status}</p>
                </div>
              </div>
            </div>
            {user.profileImageUrl && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">프로필 이미지</label>
                <div className="mt-2">
                  <img 
                    src={user.profileImageUrl} 
                    alt="프로필 이미지" 
                    className="w-12 h-12 rounded-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 세션 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">세션 정보를 불러오는 중...</span>
            </div>
          ) : sessionInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">세션 ID</label>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {sessionInfo.sessionId}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">사용자 ID</label>
                  <p className="text-sm font-mono">{sessionInfo.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">생성 시간</label>
                  <p className="text-sm">{new Date(sessionInfo.createdAt).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">만료 시간</label>
                  <p className="text-sm">{new Date(sessionInfo.expiresAt).toLocaleString('ko-KR')}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">세션 유효성</label>
                <div className="mt-1">
                  <Badge variant={sessionInfo.isValid ? "default" : "destructive"}>
                    {sessionInfo.isValid ? "유효" : "만료됨"}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">세션 정보를 불러올 수 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 로컬 스토리지 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>로컬 스토리지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">세션 ID</label>
            <code className="text-xs bg-muted p-2 rounded block break-all">
              {authStorage.getSessionId() || '없음'}
            </code>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">사용자 정보</label>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(authStorage.getUserInfo(), null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}