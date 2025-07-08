"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Shield, Users, BarChart3 } from "lucide-react"
import { authAPI, authUtils, authStorage } from "@/lib/auth-api"
import { toast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // 페이지 로드 시 세션 확인
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        if (authUtils.isLoggedIn()) {
          const sessionCheck = await authAPI.checkSession()
          if (sessionCheck.valid && sessionCheck.user) {
            authStorage.setUserInfo(sessionCheck.user)
            
            if (sessionCheck.user.registrationComplete) {
              router.push('/')
              return
            } else {
              router.push('/signup')
              return
            }
          } else {
            // 유효하지 않은 세션은 제거
            authStorage.clearAll()
          }
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error)
        authStorage.clearAll()
      } finally {
        setCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [router])

  const handleKakaoLogin = async () => {
    if (isLoading) return

    setIsLoading(true)
    
    try {
      // 1. 중복 요청 방지를 위한 임시 플래그 설정
      const loginAttemptKey = 'kakao_login_attempt'
      const lastAttempt = localStorage.getItem(loginAttemptKey)
      const now = Date.now()
      
      // 3초 이내 중복 요청 방지
      if (lastAttempt && (now - parseInt(lastAttempt)) < 3000) {
        console.log('너무 빠른 연속 로그인 시도가 감지되었습니다.')
        setIsLoading(false)
        return
      }
      
      localStorage.setItem(loginAttemptKey, now.toString())
      
      // 2. 카카오 로그인 URL 조회
      const redirectUri = authUtils.generateRedirectUri()
      const { loginUrl } = await authAPI.getKakaoLoginUrl(redirectUri)
      
      // 3. 카카오 로그인 페이지로 리다이렉트
      window.location.href = loginUrl
      
    } catch (error) {
      console.error('카카오 로그인 URL 조회 실패:', error)
      toast({
        title: "로그인 오류",
        description: "카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // 세션 확인 중일 때 로딩 화면
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 메인 로그인 카드 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-blue-600 text-white p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                LastWar 관리 시스템
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                연맹 관리를 위한 통합 플랫폼
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button 
                onClick={handleKakaoLogin}
                disabled={isLoading}
                className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] font-semibold h-12 rounded-lg border-0"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    <span>카카오톡으로 로그인</span>
                  </div>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                이메일 중복 방지를 위해 카카오톡 로그인만 지원합니다
              </p>
            </div>

            {/* 테스트 로그인 링크 */}
            <div className="pt-4 border-t border-gray-200">
              <Button 
                variant="ghost" 
                className="w-full text-gray-600 hover:text-gray-800"
                onClick={() => router.push('/test-login')}
              >
                개발자용 테스트 로그인
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 제작자 정보 */}
        <div className="text-center text-xs text-gray-500">
          Made by 1242 춘식ee
        </div>
      </div>
    </div>
  )
}