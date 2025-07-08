"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authAPI, authStorage, authUtils, type AccountInfo } from '@/lib/auth-api'

interface AuthContextType {
  user: AccountInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  isMaster: boolean
  isRegistrationComplete: boolean
  login: (sessionId: string, user: AccountInfo) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 인증이 필요 없는 페이지들
const PUBLIC_ROUTES = [
  '/login',
  '/test-login',
  '/auth/kakao/callback',
  '/signup'
]

// 회원가입이 완료되지 않은 사용자도 접근 가능한 페이지들  
const INCOMPLETE_REGISTRATION_ROUTES = [
  '/signup',
  '/auth/kakao/callback'
]

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AccountInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // 초기 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 공개 페이지는 인증 확인하지 않음
        if (PUBLIC_ROUTES.includes(pathname)) {
          setIsLoading(false)
          return
        }

        // 로컬 스토리지에 세션이 없으면 로그인 페이지로
        if (!authUtils.isLoggedIn()) {
          router.push('/login')
          setIsLoading(false)
          return
        }

        // 서버에서 세션 유효성 확인
        const sessionCheck = await authAPI.checkSession()
        
        if (sessionCheck.valid && sessionCheck.user) {
          setUser(sessionCheck.user)
          authStorage.setUserInfo(sessionCheck.user)

          // 회원가입이 완료되지 않은 경우
          if (!sessionCheck.user.registrationComplete) {
            if (!INCOMPLETE_REGISTRATION_ROUTES.includes(pathname)) {
              router.push('/signup')
            }
          }
        } else {
          // 유효하지 않은 세션
          authStorage.clearAll()
          setUser(null)
          router.push('/login')
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error)
        authStorage.clearAll()
        setUser(null)
        
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [pathname, router])

  // 페이지 변경 시 권한 체크
  useEffect(() => {
    if (isLoading) return

    // 공개 페이지는 접근 허용
    if (PUBLIC_ROUTES.includes(pathname)) {
      return
    }

    // 인증되지 않은 사용자
    if (!user) {
      router.push('/login')
      return
    }

    // 회원가입이 완료되지 않은 사용자
    if (!user.registrationComplete && !INCOMPLETE_REGISTRATION_ROUTES.includes(pathname)) {
      router.push('/signup')
      return
    }

    // 마스터 권한이 필요한 페이지 (필요시 추가 구현)
    // if (MASTER_REQUIRED_ROUTES.includes(pathname) && user.role !== 'MASTER') {
    //   router.push('/')
    //   return
    // }

  }, [pathname, user, isLoading, router])

  const login = (sessionId: string, userData: AccountInfo) => {
    // 세션은 서버에서 자동 관리, 사용자 정보만 저장
    authStorage.setUserInfo(userData)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
    } finally {
      authStorage.clearAll()
      setUser(null)
      router.push('/login')
    }
  }

  const refreshUser = async () => {
    try {
      const sessionCheck = await authAPI.checkSession()
      
      if (sessionCheck.valid && sessionCheck.user) {
        setUser(sessionCheck.user)
        authStorage.setUserInfo(sessionCheck.user)
      } else {
        await logout()
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error)
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isMaster: user?.role === 'MASTER',
    isRegistrationComplete: user?.registrationComplete === true,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireMaster = false
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isMaster } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login')
      } else if (!isLoading && requireMaster && !isMaster) {
        router.push('/')
      }
    }, [user, isLoading, isMaster, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user || (requireMaster && !isMaster)) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}