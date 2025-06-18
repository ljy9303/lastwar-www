"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")
        const state = searchParams.get("state")

        // 에러가 있는 경우 에러 페이지로 리다이렉트
        if (error) {
          const errorParams = new URLSearchParams({
            error,
            ...(errorDescription && { error_description: errorDescription }),
          })
          router.push(`/auth/error?${errorParams.toString()}`)
          return
        }

        if (!code) {
          router.push("/auth/error?message=인증 코드가 없습니다.")
          return
        }

        setMessage("카카오 로그인을 처리하고 있습니다...")

        // 백엔드 콜백 API 호출 - 올바른 도메인 사용
        const callbackUrl = `https://api.chunsik.site/api/auth/kakao/callback?code=${code}${state ? `&state=${state}` : ""}`

        const response = await fetch(callbackUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.token || data.accessToken) {
            const token = data.token || data.accessToken
            login(token)
            setStatus("success")
            setMessage("로그인이 완료되었습니다.")

            // 성공 후 대시보드로 이동
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          } else {
            throw new Error("토큰을 받지 못했습니다.")
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `서버 오류: ${response.status}`)
        }
      } catch (error) {
        console.error("콜백 처리 실패:", error)
        setStatus("error")
        const errorMessage = error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다."
        setMessage(errorMessage)
      }
    }

    handleCallback()
  }, [searchParams, login, router])

  const handleRetry = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "로그인 처리 중"}
            {status === "success" && "로그인 성공"}
            {status === "error" && "로그인 실패"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="text-green-600">{message}</p>
              <p className="text-sm text-muted-foreground">잠시 후 대시보드로 이동합니다.</p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="text-red-600">{message}</p>
              <Button onClick={handleRetry} className="w-full">
                다시 시도
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
