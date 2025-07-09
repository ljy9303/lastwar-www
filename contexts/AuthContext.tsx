"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  const isLoading = status === 'loading'

  // NextAuth 세션 기반으로 사용자 정보 업데이트
  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      const userData: AccountInfo = {
        userId: parseInt(session.user.id),
        kakaoId: '',
        email: session.user.email || '',
        nickname: session.user.name || '',
        profileImageUrl: session.user.image,
        role: session.user.role || 'USER',
        status: 'ACTIVE',
        serverAllianceId: session.user.serverAllianceId,
        registrationComplete: session.user.registrationComplete || false
      }
      
      // 현재 사용자와 다를 때만 업데이트
      if (!user || user.userId !== userData.userId || user.email !== userData.email) {
        setUser(userData)
      }
    } else if (user) {
      setUser(null)
    }
  }, [session, status]) // user 의존성 제거

  // 페이지 변경 시 권한 체크 (제한적으로만 실행)
  useEffect(() => {
    if (isLoading || status === 'loading') return

    // 공개 페이지는 접근 허용
    if (PUBLIC_ROUTES.includes(pathname)) {
      return
    }

    // AuthLayout에서 리다이렉트 처리하므로 여기서는 제거

  }, [pathname, status, isLoading]) // user와 router 의존성 제거

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
    // NextAuth 세션은 자동으로 관리되므로 별도 새로고침 불필요
    // 필요시 강제로 세션을 다시 가져올 수 있음
    if (session?.user) {
      const userData: AccountInfo = {
        userId: parseInt(session.user.id),
        kakaoId: '',
        email: session.user.email || '',
        nickname: session.user.name || '',
        profileImageUrl: session.user.image,
        role: session.user.role || 'USER',
        status: 'ACTIVE',
        serverAllianceId: session.user.serverAllianceId,
        registrationComplete: session.user.registrationComplete || false
      }
      setUser(userData)
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