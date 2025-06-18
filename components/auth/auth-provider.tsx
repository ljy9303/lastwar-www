"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { verifyToken, testAuthStatus } from "@/app/actions/auth-actions"

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  user: any | null
  login: (token: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("jwt_token")
        if (storedToken) {
          const isValid = await verifyToken(storedToken)
          if (isValid) {
            try {
              const userData = await testAuthStatus(storedToken)
              setToken(storedToken)
              setUser(userData)
              setIsAuthenticated(true)
            } catch (error) {
              console.error("사용자 정보 조회 실패:", error)
              // 토큰은 유효하지만 사용자 정보 조회 실패 시에도 인증된 것으로 처리
              setToken(storedToken)
              setIsAuthenticated(true)
            }
          } else {
            localStorage.removeItem("jwt_token")
          }
        }
      } catch (error) {
        console.error("인증 초기화 실패:", error)
        localStorage.removeItem("jwt_token")
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken)
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("jwt_token")
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
