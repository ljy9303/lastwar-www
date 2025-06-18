"use client"

import type React from "react"

import { useAuth } from "./auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

// 인증이 필요하지 않은 공개 라우트들
const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/api/auth/kakao/login",
  "/api/auth/kakao/callback",
  "/api/auth/kakao/login-url",
  "/oauth2/authorization/kakao",
  "/oauth2/config",
]

// 경로가 공개 라우트인지 확인하는 함수
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => {
    if (route.includes("*")) {
      // 와일드카드 패턴 처리
      const baseRoute = route.replace("*", "")
      return pathname.startsWith(baseRoute)
    }
    return pathname === route || pathname.startsWith(route)
  })
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // API 경로는 클라이언트 사이드 라우팅에서 제외
    if (pathname.startsWith("/api/")) {
      return
    }

    if (!loading && !isAuthenticated && !isPublicRoute(pathname)) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, pathname, router])

  // API 경로는 그대로 통과
  if (pathname.startsWith("/api/")) {
    return <>{children}</>
  }

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
  if (isPublicRoute(pathname) || isAuthenticated) {
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
