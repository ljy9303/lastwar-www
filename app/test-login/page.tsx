'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { authAPI, authStorage } from '@/lib/auth-api'

interface TestLoginForm {
  email: string
}

export default function TestLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<TestLoginForm>({
    email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await authAPI.testLogin({
        email: form.email,
        nickname: form.email.split('@')[0] // 이메일의 @ 앞부분을 닉네임으로 사용
      })

      if (data.status === 'login') {
        // 사용자 정보만 저장 (세션은 서버에서 자동 관리)
        if (data.user) {
          authStorage.setUserInfo(data.user)
        }

        toast({
          title: '로그인 성공',
          description: `${data.user?.nickname}님 환영합니다! (서버연맹ID: ${data.user?.serverAllianceId})`,
          variant: 'default'
        })

        // 대시보드로 리다이렉트
        router.push('/dashboard')
      } else {
        throw new Error(data.message || '로그인에 실패했습니다')
      }
    } catch (error) {
      console.error('테스트 로그인 오류:', error)
      toast({
        title: '로그인 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>테스트 로그인</CardTitle>
          <CardDescription>
            개발/테스트용 이메일 로그인입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="기존 계정 이메일을 입력하세요"
                required
              />
              <p className="text-xs text-gray-500">
                기존 계정의 이메일을 입력하면 해당 계정의 서버연맹으로 로그인됩니다
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '테스트 로그인'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
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