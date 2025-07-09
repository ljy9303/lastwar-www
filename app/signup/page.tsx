"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Server, Shield, User, ArrowLeft, Loader2 } from "lucide-react"
import { authAPI, authStorage, authUtils, type SignupRequest } from "@/lib/auth-api"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [formData, setFormData] = useState<SignupRequest>({
    serverInfo: 0,
    allianceTag: '',
    nickname: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (!authUtils.isLoggedIn()) {
          router.push('/login')
          return
        }

        const sessionCheck = await authAPI.checkSession()
        if (!sessionCheck.valid || !sessionCheck.user) {
          authStorage.clearAll()
          router.push('/login')
          return
        }

        // 이미 회원가입이 완료된 경우
        if (sessionCheck.user.registrationComplete) {
          router.push('/')
          return
        }

        setCurrentUser(sessionCheck.user)
        
        // 기존 정보가 있으면 폼에 설정
        if (sessionCheck.user.serverInfo) {
          setFormData(prev => ({ ...prev, serverInfo: sessionCheck.user.serverInfo! }))
        }
        if (sessionCheck.user.allianceTag) {
          setFormData(prev => ({ ...prev, allianceTag: sessionCheck.user.allianceTag! }))
        }
        if (sessionCheck.user.nickname) {
          setFormData(prev => ({ ...prev, nickname: sessionCheck.user.nickname }))
        }
        
      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
        authStorage.clearAll()
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [router])


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
        // 업데이트된 사용자 정보만 저장 (세션은 서버에서 자동 관리)
        if (signupResponse.user) {
          authStorage.setUserInfo(signupResponse.user)
        }

        toast({
          title: "회원가입 완료",
          description: "환영합니다! 메인 페이지로 이동합니다."
        })

        setTimeout(() => {
          router.push('/')
        }, 1500)

      } else {
        toast({
          title: "회원가입 실패",
          description: signupResponse.message,
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('회원가입 실패:', error)
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
    authStorage.clearAll()
    router.push('/login')
  }

  // 인증 확인 중일 때 로딩 화면
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 메인 회원가입 카드 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-green-600 text-white p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                회원가입
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                서버 정보와 연맹 정보를 입력해주세요
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이메일 (읽기 전용) */}
              {currentUser && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                    <Shield className="h-4 w-4" />
                    로그인 이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">
                    카카오 계정으로 인증된 이메일입니다
                  </p>
                </div>
              )}

              {/* 서버 정보 */}
              <div className="space-y-2">
                <Label htmlFor="serverInfo" className="flex items-center gap-2 text-gray-700">
                  <Server className="h-4 w-4 text-blue-600" />
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
                  className={errors.serverInfo ? "border-red-500" : ""}
                />
                {errors.serverInfo && (
                  <p className="text-sm text-red-500">{errors.serverInfo}</p>
                )}
                <p className="text-xs text-gray-500">
                  • 게임 접속 시 확인할 수 있는 서버 번호 (1~9999)
                  <br />
                  • 잘못 입력하면 같은 서버 유저들과 매칭되지 않을 수 있습니다
                </p>
              </div>

              {/* 연맹 태그 */}
              <div className="space-y-2">
                <Label htmlFor="allianceTag" className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4 text-green-600" />
                  연맹 태그 *
                </Label>
                
                <Input
                  id="allianceTag"
                  type="text"
                  maxLength={4}
                  placeholder="소속 연맹의 3~4자리 태그 (예: ROK, ROKK, ABC, ABCD)"
                  value={formData.allianceTag}
                  onChange={(e) => handleInputChange('allianceTag', e.target.value.toUpperCase())}
                  className={errors.allianceTag ? "border-red-500" : ""}
                />
                
                {errors.allianceTag && (
                  <p className="text-sm text-red-500">{errors.allianceTag}</p>
                )}
                
                <p className="text-xs text-gray-500">
                  • 게임 내 연맹 정보에서 확인 가능한 3~4자리 태그
                  <br />
                  • 영문자(A-Z)와 숫자(0-9)만 입력 가능, 자동으로 대문자 변환
                  <br />
                  • 연맹 태그가 틀리면 같은 연맹원과 구분되지 않습니다
                </p>
              </div>

              {/* 닉네임 */}
              <div className="space-y-2">
                <Label htmlFor="nickname" className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 text-purple-600" />
                  닉네임 *
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  maxLength={20}
                  placeholder="시스템에서 사용할 닉네임 (예: 플레이어123, 김철수)"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className={errors.nickname ? "border-red-500" : ""}
                />
                {errors.nickname && (
                  <p className="text-sm text-red-500">{errors.nickname}</p>
                )}
                <p className="text-xs text-gray-500">
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
                className="w-full bg-green-600 hover:bg-green-700 h-12"
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
              className="w-full"
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