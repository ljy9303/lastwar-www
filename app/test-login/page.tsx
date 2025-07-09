'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface TestLoginForm {
  email: string
}

export default function TestLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<TestLoginForm>({
    email: ''
  })

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('test', {
        email: form.email,
        nickname: form.email.split('@')[0],
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        toast({
          title: '로그인 성공',
          description: `${form.email.split('@')[0]}님 환영합니다!`,
          variant: 'default'
        })

        // 대시보드로 리다이렉트
        router.push('/dashboard')
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

  // 세션 로딩 중일 때 로딩 화면
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인되어 있으면 빈 화면 (리다이렉트 중)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드로 이동 중...</p>
        </div>
      </div>
    )
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
                placeholder="기존 계정 이메일을 입력하세요"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500">
                기존 계정의 이메일을 입력하면 해당 계정의 서버연맹으로 로그인됩니다
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