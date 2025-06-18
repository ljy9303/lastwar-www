"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const message = searchParams.get("message")

    if (error) {
      switch (error) {
        case "access_denied":
          setErrorMessage("로그인이 취소되었습니다.")
          break
        case "invalid_request":
          setErrorMessage("잘못된 요청입니다.")
          break
        case "server_error":
          setErrorMessage("서버 오류가 발생했습니다.")
          break
        default:
          setErrorMessage(errorDescription || message || "로그인 중 오류가 발생했습니다.")
      }
    } else {
      setErrorMessage(message || "알 수 없는 오류가 발생했습니다.")
    }
  }, [searchParams])

  const handleRetry = () => {
    router.push("/login")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">로그인 실패</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              다시 로그인
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              홈으로 이동
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
