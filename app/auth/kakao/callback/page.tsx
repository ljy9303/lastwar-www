"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { authAPI, authStorage, authUtils } from "@/lib/auth-api"
import { toast } from "@/hooks/use-toast"

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
        return
      }
      
      const code = searchParams.get('code')
      const cacheKey = `kakao_callback_${code}`
      
      // 동일한 코드로 이미 처리했는지 확인 (중복 방지)
      if (code && localStorage.getItem(cacheKey)) {
        console.log('이미 처리된 카카오 인증 코드입니다.')
        router.push('/login')
        return
      }
      
      setIsProcessing(true)
      
      try {
        // URL 파라미터에서 code와 state 추출
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        // 코드 사용 표시 (1분간 유효)
        if (code) {
          localStorage.setItem(cacheKey, 'processing')
          setTimeout(() => {
            localStorage.removeItem(cacheKey)
          }, 60000)
        }

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

        // 백엔드로 로그인 요청
        const redirectUri = authUtils.generateRedirectUri()
        const loginResponse = await authAPI.kakaoLogin({
          code,
          redirectUri,
          state: state || undefined
        })

        console.log('[FRONTEND] 카카오 로그인 API 응답:', loginResponse)
        console.log('[FRONTEND] 사용자 정보:', loginResponse.user)

        // 사용자 정보만 저장 (세션은 서버에서 자동 관리)
        if (loginResponse.user) {
          authStorage.setUserInfo(loginResponse.user)
        }

        // 로그인 상태에 따른 처리
        if (loginResponse.status === 'login') {
          // 로그인 성공
          setStatus('success')
          setMessage('로그인되었습니다!')
          
          toast({
            title: "로그인 성공",
            description: `환영합니다, ${loginResponse.user?.nickname}님!`,
          })
          
          setTimeout(() => {
            router.push('/')
          }, 2000)
          
        } else if (loginResponse.status === 'signup_required') {
          // 회원가입 필요 - 즉시 이동
          router.push('/signup')
          
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
        setMessage('로그인 처리 중 오류가 발생했습니다.')
        
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
  }, [searchParams, router, isProcessing])

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