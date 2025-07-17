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
  const [processedCode, setProcessedCode] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      // 이미 처리 중이면 중복 실행 방지
      if (isProcessing) {
        console.log('이미 처리 중입니다. 중복 실행 방지.')
        return
      }
      
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const processedCodeKey = code ? `kakao_processed_${code}` : null
      
      // 에러가 있는 경우
      if (error) {
        setStatus('error')
        setMessage('카카오 로그인 중 오류가 발생했습니다.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        return
      }

      // Authorization Code가 없는 경우
      if (!code) {
        setStatus('error')
        setMessage('인증 코드가 없습니다.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        return
      }

      // 이미 처리된 코드인 경우 중복 처리 방지
      if (processedCode === code) {
        console.log('이미 처리된 Authorization Code입니다:', code)
        return
      }

      // 로컬스토리지로 이미 처리된 코드인지 확인
      if (processedCodeKey && localStorage.getItem(processedCodeKey)) {
        console.log('로컬스토리지에서 이미 처리된 코드를 발견했습니다:', code)
        setStatus('success')
        setMessage('이미 처리된 요청입니다. 메인 페이지로 이동합니다.')
        setTimeout(() => {
          router.push('/')
        }, 1000)
        return
      }

      // 처리 시작 - 로컬스토리지에 마킹
      if (processedCodeKey) {
        localStorage.setItem(processedCodeKey, 'true')
      }
      setIsProcessing(true)
      setProcessedCode(code)
      
      try {
        // NextAuth.js를 사용한 카카오 로그인 처리
        const redirectUri = authUtils.generateRedirectUri()
        const loginResponse = await authAPI.kakaoLogin({
          code,
          redirectUri
        })
        
        if (loginResponse.status === 'login') {
          setStatus('success')
          setMessage('로그인 성공!')
          
          // 성공 토스트 메시지
          toast({
            title: "로그인 성공",
            description: "환영합니다! 메인 페이지로 이동합니다."
          })
          
          setTimeout(() => {
            // 성공 후 처리된 코드 정리 (5분 후에 자동 정리되도록)
            setTimeout(() => {
              if (processedCodeKey) {
                localStorage.removeItem(processedCodeKey)
              }
            }, 5 * 60 * 1000)
            
            router.push('/')
          }, 1500)
        } else {
          throw new Error('로그인 실패')
        }
        
      } catch (error) {
        console.error('카카오 로그인 콜백 처리 실패:', error)
        setStatus('error')
        setMessage('로그인 처리 중 오류가 발생했습니다.')
        
        toast({
          title: "로그인 실패",
          description: "로그인 처리 중 오류가 발생했습니다.",
          variant: "destructive"
        })
        
        // 실패 시 처리된 코드 정리
        if (processedCodeKey) {
          localStorage.removeItem(processedCodeKey)
        }
        
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