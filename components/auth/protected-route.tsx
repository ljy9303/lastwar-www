"use client"

import type React from "react"

import { useAuth } from "./auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ["/login", "/auth/callback"]

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, pathname, router])

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 공개 라우트이거나 인증된 사용자인 경우
  if (PUBLIC_ROUTES.includes(pathname) || isAuthenticated) {
    return <>{children}</>
  }

  // 인증되지 않은 사용자는 로딩 화면 표시 (리다이렉트 중)
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">로그인 페이지로 이동 중...</p>
      </div>
    </div>
  )
}
