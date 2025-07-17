"use client"

import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './sidebar'
import { Suspense, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface AuthLayoutProps {
  children: React.ReactNode
}

// 사이드바를 표시하지 않을 페이지들
const NO_SIDEBAR_ROUTES = [
  '/login',
  '/test-login',
  '/signup', 
  '/auth/kakao/callback'
]

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const redirectedRef = useRef(false) // 리다이렉트 중복 방지

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const shouldShowSidebar = isAuthenticated && !NO_SIDEBAR_ROUTES.includes(pathname)

  // 안전한 리다이렉트 처리
  useEffect(() => {
    console.log('AuthLayout - status:', status, 'pathname:', pathname, 'isAuthenticated:', isAuthenticated)
    
    if (isLoading || redirectedRef.current) return

    if (!isAuthenticated && !NO_SIDEBAR_ROUTES.includes(pathname)) {
      console.log('AuthLayout - 인증되지 않음, 로그인으로 리다이렉트')
      redirectedRef.current = true
      window.location.replace('/login')
    }
  }, [isLoading, isAuthenticated, pathname, status])

  // 인증이 실패한 경우 로그인 페이지로 리다이렉트 중 표시
  if (!isLoading && !isAuthenticated && !NO_SIDEBAR_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  // 로딩 중일 때 (단, 로그인 페이지는 로딩 상태를 보여주지 않음)
  if (isLoading && !NO_SIDEBAR_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">시스템을 초기화하는 중...</p>
        </div>
      </div>
    )
  }

  // 사이드바가 있는 레이아웃 (인증된 사용자)
  if (shouldShowSidebar) {
    return (
      <div className="flex flex-col md:flex-row h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-3 md:p-6 pt-2 md:pt-6 w-full overscroll-behavior-contain will-change-scroll contain-layout">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    )
  }

  // 풀스크린 레이아웃 (로그인, 회원가입 등)
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        {children}
      </Suspense>
    </main>
  )
}