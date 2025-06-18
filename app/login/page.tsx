"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getKakaoLoginUrl } from "@/app/actions/auth-actions"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)
      setError("")
      const loginUrl = await getKakaoLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      console.error("카카오 로그인 실패:", error)
      setError("로그인 URL을 가져오는데 실패했습니다.")
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">1242 ROKK</CardTitle>
          <p className="text-muted-foreground">로그인이 필요합니다</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              "카카오로 로그인"
            )}
          </Button>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
