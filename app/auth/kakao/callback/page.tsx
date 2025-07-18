"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { authAPI, authStorage, authUtils } from "@/lib/auth-api"
import { toast } from "@/hooks/use-toast"
import { signIn } from "next-auth/react"

export default function KakaoCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'signup_required'>('loading')
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      // 이미 처리 중이면 중복 실행 방지
      if (isProcessing) {
        console.log('이미 처리 중이므로 중복 실행 방지')
        return
      }
      
      const code = searchParams.get('code')
      
      // 인가코드는 저장하지 않고 매번 새로 OAuth 처리
      
      setIsProcessing(true)
      
      try {
        // URL 파라미터에서 code와 state 추출
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // 에러가 있는 경우
        if (error) {
          setStatus('error')
          setMessage(errorDescription || '카카오 로그인 중 오류가 발생했습니다.')
          
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        // Authorization code가 없는 경우
        if (!code) {
          setStatus('error')
          setMessage('인증 코드가 없습니다.')
          
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        // NextAuth signIn을 통해 백엔드 로그인 (중복 호출 방지)
        const redirectUri = authUtils.generateRedirectUri()
        console.log('[Callback] NextAuth signIn 호출 시작')
        
        const signInResult = await signIn('kakao', {
          code,
          redirectUri,
          redirect: false
        })
        
        console.log('[Callback] NextAuth signIn 결과:', signInResult)
        
        if (!signInResult?.ok) {
          throw new Error('NextAuth 세션 생성 실패: ' + (signInResult?.error || '알 수 없는 오류'))
        }
        
        // NextAuth 세션에서 사용자 정보 조회
        const { getSession } = await import("next-auth/react")
        const session = await getSession()
        console.log('[Callback] NextAuth 세션:', session)
        
        if (!session?.user) {
          throw new Error('NextAuth 세션 생성되었지만 사용자 정보 없음')
        }
        
        // LoginResponse 형태로 변환
        const loginResponse = {
          status: session.user.requiresSignup || !session.user.registrationComplete ? 'signup_required' : 'login',
          user: {
            userId: parseInt(session.user.id),
            kakaoId: session.user.kakaoId || '',
            email: session.user.email || '',
            nickname: session.user.name || '',
            profileImageUrl: session.user.image,
            role: session.user.role || 'USER',
            status: 'ACTIVE',
            serverAllianceId: session.user.serverAllianceId,
            registrationComplete: session.user.registrationComplete || false
          },
          message: session.user.requiresSignup ? '회원가입이 필요합니다' : '로그인 성공'
        }

        console.log('[FRONTEND] 카카오 로그인 API 응답:', loginResponse)
        console.log('[FRONTEND] 사용자 정보:', loginResponse.user)

        // 로그인 상태에 따른 처리
        if (loginResponse.status === 'login') {
          console.log('[Callback] 카카오 로그인 성공 - NextAuth 세션 생성됨')
          
          setStatus('success')
          setMessage('로그인되었습니다!')
          
          toast({
            title: "로그인 성공",
            description: `환영합니다, ${loginResponse.user?.nickname}님!`,
          })
          
          // OAuth 로그인 성공 로그
          
          console.log('[Callback] NextAuth 세션 기반 로그인 완료 - 대시보드로 이동')
          router.push('/dashboard')
          
        } else if (loginResponse.status === 'signup_required') {
          // 회원가입 필요 - 사용자 정보를 안전하게 전달
          const userId = loginResponse.user?.userId
          if (userId && loginResponse.user) {
            console.log('[Callback] 회원가입 페이지로 이동 - userId:', userId)
            
            // 방법 1: sessionStorage에 임시 저장 (새로고침 시 유지, 탭 닫으면 삭제)
            const tempUserData = {
              userId: loginResponse.user.userId,
              email: loginResponse.user.email,
              nickname: loginResponse.user.nickname,
              profileImageUrl: loginResponse.user.profileImageUrl,
              timestamp: Date.now()
            }
            sessionStorage.setItem('signup_user_data', JSON.stringify(tempUserData))
            
            // 회원가입 처리 로그
            
            // URL에 민감 정보 없이 이동
            router.push('/signup')
          } else {
            console.error('[Callback] 사용자 ID가 없습니다')
            router.push('/login')
          }
          
        } else {
          // 기타 오류
          setStatus('error')
          setMessage(loginResponse.message || '로그인 처리 중 오류가 발생했습니다.')
          
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }

      } catch (error) {
        console.error('카카오 로그인 콜백 처리 실패:', error)
        setStatus('error')
        setMessage(`로그인 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        
        toast({
          title: "로그인 실패",
          description: "잠시 후 다시 시도해주세요.",
          variant: "destructive"
        })
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, router])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">로그인 처리 중</h2>
            <p className="text-gray-600">카카오 로그인을 처리하고 있습니다...</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">로그인 성공!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">메인 페이지로 이동합니다...</p>
          </div>
        )

      case 'signup_required':
        return (
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">회원가입 필요</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">회원가입 페이지로 이동합니다...</p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">로그인 실패</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">로그인 페이지로 이동합니다...</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              LastWar 로그인
            </CardTitle>
            <CardDescription className="text-gray-600">
              카카오톡 로그인 처리
            </CardDescription>
          </CardHeader>
          
          <CardContent className="py-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}