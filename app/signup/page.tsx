"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Server, Shield, User, ArrowLeft, Loader2 } from "lucide-react"
import { authAPI, authStorage, authUtils, type SignupRequest } from "@/lib/auth-api"
import { signIn } from "next-auth/react"
import { toast } from "@/hooks/use-toast"
import { createLogger } from "@/lib/logger"

const logger = createLogger('Signup')

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [formData, setFormData] = useState<SignupRequest>({
    userId: 0,
    serverInfo: 0,
    allianceTag: '',
    nickname: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 페이지 로드 시 URL 파라미터 또는 세션 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        logger.debug('checkAuthStatus 시작')
        
        // 1. sessionStorage에서 임시 사용자 정보 확인 (카카오 콜백에서 온 경우)
        const signupUserData = sessionStorage.getItem('signup_user_data')
        if (signupUserData) {
          try {
            const userData = JSON.parse(signupUserData)
            const timeDiff = Date.now() - userData.timestamp
            
            // 10분 이내의 데이터만 유효하게 처리
            if (timeDiff < 10 * 60 * 1000) {
              logger.debug('sessionStorage에서 사용자 정보 로드', { userId: userData.userId })
              
              const user = {
                userId: userData.userId,
                email: userData.email,
                nickname: userData.nickname,
                profileImageUrl: userData.profileImageUrl,
                registrationComplete: false
              }
              
              setCurrentUser(user)
              setFormData(prev => ({ 
                ...prev, 
                userId: userData.userId,
                nickname: userData.nickname
              }))
              setCheckingAuth(false)
              logger.debug('sessionStorage로 사용자 설정 완료')
              return // sessionStorage 데이터가 있으면 여기서 완전히 종료
            } else {
              logger.debug('sessionStorage 데이터가 만료됨 (10분 초과)')
              sessionStorage.removeItem('signup_user_data')
            }
          } catch (error) {
            logger.error('sessionStorage 데이터 파싱 실패', error)
            sessionStorage.removeItem('signup_user_data')
          }
        }

        // 2. URL 파라미터에서 사용자 정보 확인 (백업 방법)
        const urlParams = new URLSearchParams(window.location.search)
        const userId = searchParams.get('userId') || urlParams.get('userId')
        const email = searchParams.get('email') || urlParams.get('email')
        const nickname = searchParams.get('nickname') || urlParams.get('nickname')
        
        if (userId && email && nickname) {
          logger.debug('URL 파라미터에서 사용자 정보 로드 (백업)', { userId })
          
          const decodedEmail = decodeURIComponent(email)
          const decodedNickname = decodeURIComponent(nickname)
          const userIdNum = parseInt(userId)
          
          if (userIdNum > 0 && decodedEmail.includes('@') && decodedNickname.length > 0) {
            const user = {
              userId: userIdNum,
              email: decodedEmail,
              nickname: decodedNickname,
              registrationComplete: false
            }
            
            setCurrentUser(user)
            setFormData(prev => ({ 
              ...prev, 
              userId: userIdNum,
              nickname: decodedNickname
            }))
            setCheckingAuth(false)
            return
          }
        }

        // 2. NextAuth 세션 기반 확인 (URL 파라미터가 없는 경우에만)
        logger.debug('URL 파라미터 없음 - NextAuth 세션 확인')
        try {
          const sessionCheck = await authAPI.checkSession()
          if (sessionCheck.valid && sessionCheck.user) {
            // 이미 회원가입이 완료된 경우
            if (sessionCheck.user.registrationComplete) {
              logger.debug('이미 회원가입 완료 - 홈으로 이동')
              router.push('/')
              return
            }

            logger.debug('NextAuth 세션으로 사용자 정보 설정')
            setCurrentUser(sessionCheck.user)
            setFormData(prev => ({ 
              ...prev, 
              userId: sessionCheck.user.userId,
              serverInfo: sessionCheck.user.serverInfo || 0,
              allianceTag: sessionCheck.user.allianceTag || '',
              nickname: sessionCheck.user.nickname || ''
            }))
            setCheckingAuth(false)
            return
          }
        } catch (sessionError) {
          logger.debug('세션 확인 중 오류 (무시)', sessionError)
        }

        // 3. 둘 다 없으면 로그인 페이지로
        logger.debug('인증 정보 없음 - 로그인 페이지로 이동')
        router.push('/login')
        
      } catch (error) {
        logger.error('인증 상태 확인 실패', error)
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [router, searchParams])


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 서버 정보 검증
    if (!formData.serverInfo || formData.serverInfo < 1 || formData.serverInfo > 9999) {
      newErrors.serverInfo = '서버 번호는 1-9999 사이의 숫자여야 합니다'
    }

    // 연맹 태그 검증
    if (!formData.allianceTag) {
      newErrors.allianceTag = '연맹 태그는 필수입니다'
    } else if (formData.allianceTag.length < 3 || formData.allianceTag.length > 4) {
      newErrors.allianceTag = '연맹 태그는 3~4자리여야 합니다'
    } else if (!/^[a-zA-Z0-9]{3,4}$/.test(formData.allianceTag)) {
      newErrors.allianceTag = '연맹 태그는 영문자와 숫자만 사용할 수 있습니다'
    }

    // 닉네임 검증
    if (!formData.nickname) {
      newErrors.nickname = '닉네임은 필수입니다'
    } else if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      newErrors.nickname = '닉네임은 2-20자 사이여야 합니다'
    } else if (!/^[a-zA-Z0-9가-힣]+$/.test(formData.nickname)) {
      newErrors.nickname = '닉네임은 영문자, 숫자, 한글만 사용할 수 있습니다 (띄어쓰기, 특수문자 불가)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SignupRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isLoading) {
      return
    }

    setIsLoading(true)

    try {
      const signupResponse = await authAPI.signup(formData)

      if (signupResponse.success) {
        // sessionStorage 임시 데이터 정리
        sessionStorage.removeItem('signup_user_data')
        
        // 토큰과 사용자 정보 저장
        if (signupResponse.accessToken && signupResponse.refreshToken) {
          logger.debug('토큰 저장 중...')
          authStorage.setTokens(signupResponse.accessToken, signupResponse.refreshToken)
        }
        
        if (signupResponse.user) {
          logger.debug('사용자 정보 저장 중...')
          authStorage.setUserInfo(signupResponse.user)
        }
        
        toast({
          title: "회원가입 완료",
          description: "환영합니다! 메인 페이지로 이동합니다."
        })

        // 회원가입 완료 후 NextAuth 세션 업데이트
        logger.debug('회원가입 완료 - NextAuth 세션 업데이트')
        try {
          // Test provider로 NextAuth 세션 생성 (회원가입 완료된 사용자 정보로)
          await signIn('test', {
            email: signupResponse.user.email,
            nickname: signupResponse.user.nickname,
            redirect: false
          })
          
          // NextAuth 세션 생성 후 홈페이지로 이동
          logger.debug('NextAuth 세션 생성 완료 - 대시보드로 이동')
          router.push('/dashboard')
        } catch (sessionError) {
          logger.error('NextAuth 세션 생성 실패', sessionError)
          // 세션 생성 실패해도 홈페이지로 이동 (백엔드 JWT는 있음)
          window.location.href = '/'
        }

      } else {
        toast({
          title: "회원가입 실패",
          description: signupResponse.message,
          variant: "destructive"
        })
      }

    } catch (error) {
      logger.error('회원가입 실패', error)
      toast({
        title: "회원가입 오류",
        description: "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    // sessionStorage 임시 데이터 정리
    sessionStorage.removeItem('signup_user_data')
    authStorage.clearAll()
    router.push('/login')
  }

  // 인증 확인 중일 때 로딩 화면
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-primary dark:border-game-accent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* 메인 회원가입 카드 */}
        <Card className="border-0 shadow-lg dark:shadow-2xl dark:bg-slate-800/80 dark:backdrop-blur-sm transition-all duration-300">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-gradient-to-br from-game-success to-game-primary text-white p-3 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                회원가입
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 mt-2 transition-colors duration-300">
                서버 정보와 연맹 정보를 입력해주세요
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이메일 (읽기 전용) */}
              {currentUser && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    <Shield className="h-4 w-4" />
                    로그인 이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 cursor-not-allowed border-gray-300 dark:border-slate-600 transition-colors duration-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    카카오 계정으로 인증된 이메일입니다
                  </p>
                </div>
              )}

              {/* 서버 정보 */}
              <div className="space-y-2">
                <Label htmlFor="serverInfo" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  서버 번호 *
                </Label>
                <Input
                  id="serverInfo"
                  type="text"
                  maxLength={4}
                  placeholder="게임 내 서버 번호를 입력하세요 (예: 123, 1242)"
                  value={formData.serverInfo > 0 ? formData.serverInfo : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '') // 숫자만 허용
                    if (value.length <= 4) {
                      handleInputChange('serverInfo', value ? parseInt(value) : 0)
                    }
                  }}
                  className={errors.serverInfo ? "border-red-500 dark:border-red-400" : "dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-300"}
                />
                {errors.serverInfo && (
                  <p className="text-sm text-red-500 dark:text-red-400 transition-colors duration-300">{errors.serverInfo}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  • 게임 접속 시 확인할 수 있는 서버 번호 (1~9999)
                  <br />
                  • 잘못 입력하면 같은 서버 연맹원들과 매칭되지 않을 수 있습니다
                </p>
              </div>

              {/* 연맹 태그 */}
              <div className="space-y-2">
                <Label htmlFor="allianceTag" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  연맹 태그 *
                </Label>
                
                <Input
                  id="allianceTag"
                  type="text"
                  maxLength={4}
                  placeholder="소속 연맹의 3~4자리 태그 (예: ROK, ROKK, ABC, ABCD)"
                  value={formData.allianceTag}
                  onChange={(e) => handleInputChange('allianceTag', e.target.value.toUpperCase())}
                  className={errors.allianceTag ? "border-red-500 dark:border-red-400" : "dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-300"}
                />
                
                {errors.allianceTag && (
                  <p className="text-sm text-red-500 dark:text-red-400 transition-colors duration-300">{errors.allianceTag}</p>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  • 게임 내 연맹 정보에서 확인 가능한 3~4자리 태그
                  <br />
                  • 영문자(A-Z)와 숫자(0-9)만 입력 가능, 자동으로 대문자 변환
                  <br />
                  • 연맹 태그가 틀리면 같은 연맹원과 구분되지 않습니다
                </p>
              </div>

              {/* 닉네임 */}
              <div className="space-y-2">
                <Label htmlFor="nickname" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  닉네임 *
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  maxLength={20}
                  placeholder="시스템에서 사용할 닉네임 (예: 플레이어123, 김철수)"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className={errors.nickname ? "border-red-500 dark:border-red-400" : "dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 transition-colors duration-300"}
                />
                {errors.nickname && (
                  <p className="text-sm text-red-500 dark:text-red-400 transition-colors duration-300">{errors.nickname}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  • 2~20자 길이, 영문자, 숫자, 한글만 사용 가능
                  <br />
                  • 띄어쓰기, 특수문자(!@#$ 등) 사용 불가
                  <br />
                  • 다른 사용자들에게 표시되는 이름입니다
                </p>
              </div>

              {/* 제출 버튼 */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-game-success to-game-primary hover:from-game-success/90 hover:to-game-primary/90 text-white h-12 shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>가입 처리 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    <span>회원가입 완료</span>
                  </div>
                )}
              </Button>
            </form>

            {/* 로그인으로 돌아가기 */}
            <Button 
              variant="outline" 
              onClick={handleBackToLogin}
              className="w-full dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              로그인 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}