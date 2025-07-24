'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { authAPI } from '@/lib/auth-api'
import { useSession } from "next-auth/react"

interface TestLoginForm {
  email: string
}

export default function TestLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<TestLoginForm>({
    email: 'os1414@hanmail.net'  // 기본값으로 설정
  })

  const { data: session, status } = useSession()

  // 이미 로그인되어 있으면 홈페이지로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/')
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('[TestLogin] 테스트 로그인 시도:', form.email)
      
      const loginResponse = await authAPI.testLogin({
        email: form.email,
        nickname: form.email.split('@')[0]
      })

      console.log('[TestLogin] 백엔드 응답:', loginResponse)

      if (loginResponse.status === 'login') {
        toast({
          title: '로그인 성공',
          description: `${loginResponse.user?.nickname}님 환영합니다!`,
          variant: 'default'
        })

        console.log('[TestLogin] NextAuth 세션을 통한 로그인 완료 - 홈페이지로 이동')
        window.location.href = '/'
        
      } else if (loginResponse.status === 'signup_required') {
        // 카카오 로그인과 동일한 signup 처리 로직
        const userId = loginResponse.user?.userId
        if (userId && loginResponse.user) {
          console.log('[TestLogin] 회원가입 페이지로 이동 - userId:', userId)
          
          // sessionStorage에 임시 저장 (카카오 로그인과 동일한 방식)
          const tempUserData = {
            userId: loginResponse.user.userId,
            email: loginResponse.user.email,
            nickname: loginResponse.user.nickname,
            profileImageUrl: loginResponse.user.profileImageUrl,
            timestamp: Date.now()
          }
          sessionStorage.setItem('signup_user_data', JSON.stringify(tempUserData))
          
          toast({
            title: '회원가입 필요',
            description: '서버와 연맹 정보를 입력해주세요.',
            variant: 'default'
          })
          
          // 회원가입 페이지로 이동
          router.push('/signup')
        } else {
          console.error('[TestLogin] 사용자 ID가 없습니다')
          throw new Error('사용자 정보가 없습니다')
        }
        
      } else {
        throw new Error(loginResponse.message || '로그인에 실패했습니다')
      }
    } catch (error) {
      console.error('테스트 로그인 오류:', error)
      toast({
        title: '로그인 실패',
        description: error instanceof Error ? error.message : '로그인에 실패했습니다',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ email: e.target.value })
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-gray-900">테스트 로그인</CardTitle>
          <CardDescription className="text-gray-600">
            개발/테스트용 이메일 로그인입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">이메일</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="이메일을 입력하세요"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500">
                기존 계정이면 로그인, 신규 계정이면 회원가입 페이지로 이동됩니다
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                '테스트 로그인'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => router.push('/login')}
            >
              카카오 로그인으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}