import { fetchFromAPI } from './api-service'
import { signIn, signOut, getSession } from "next-auth/react"
import { createLogger } from './logger'

const logger = createLogger('authAPI')

// OAuth 관련 타입 정의
export interface KakaoLoginUrlResponse {
  loginUrl: string
  redirectUri: string
}

export interface LoginRequest {
  code: string
  redirectUri: string
  state?: string
}

export interface AccountInfo {
  userId: number
  kakaoId: string
  email: string
  nickname: string
  profileImageUrl?: string
  role: string
  status: string
  label?: string
  serverInfo?: number
  allianceTag?: string
  serverAllianceId?: number
  registrationComplete: boolean
}

export interface LoginResponse {
  status: 'login' | 'signup_required' | 'error'
  sessionId?: string
  user?: AccountInfo
  message: string
  accessToken?: string
  refreshToken?: string
}

export interface SignupRequest {
  userId: number
  serverInfo: number
  allianceTag: string
  nickname: string
}

export interface TestLoginRequest {
  email: string
  nickname: string
  serverInfo?: number
  allianceTag?: string
}

export interface SignupResponse {
  success: boolean
  message: string
  sessionId?: string
  user?: AccountInfo
  accessToken?: string
  refreshToken?: string
}

export interface SessionCheckResponse {
  valid: boolean
  message: string
  user?: AccountInfo
}


// OAuth API 함수들
export const authAPI = {
  /**
   * 카카오 로그인 URL 조회
   */
  async getKakaoLoginUrl(redirectUri?: string, state?: string): Promise<KakaoLoginUrlResponse> {
    const params = new URLSearchParams()
    if (redirectUri) params.append('redirectUri', redirectUri)
    if (state) params.append('state', state)
    
    const url = params.toString() ? `/auth/kakao/login-url?${params}` : '/auth/kakao/login-url'
    return fetchFromAPI<KakaoLoginUrlResponse>(url)
  },

  /**
   * 카카오 OAuth 로그인 (NextAuth를 통해 백엔드 호출)
   */
  async kakaoLogin(request: LoginRequest): Promise<LoginResponse> {
    logger.debug('kakaoLogin 시작 - NextAuth를 통한 인증', request)
    
    try {
      // NextAuth signIn을 통해 백엔드 호출 (중복 호출 방지)
      const signInResult = await signIn('kakao', {
        code: request.code,
        redirectUri: request.redirectUri,
        redirect: false
      })
      
      console.log('[authAPI] NextAuth signIn 결과:', signInResult)
      
      if (signInResult?.ok) {
        // NextAuth 세션에서 사용자 정보 조회
        const session = await getSession()
        console.log('[authAPI] NextAuth 세션:', session)
        
        if (session?.user) {
          // 회원가입이 필요한 사용자인지 확인
          if (session.user.requiresSignup || !session.user.registrationComplete) {
            return {
              status: 'signup_required',
              user: {
                userId: parseInt(session.user.id),
                kakaoId: session.user.kakaoId || '',
                email: session.user.email || '',
                nickname: session.user.name || '',
                profileImageUrl: session.user.image,
                role: session.user.role || 'USER',
                status: 'ACTIVE',
                label: session.user.label,
                serverInfo: session.user.serverInfo,
                allianceTag: session.user.allianceTag,
                serverAllianceId: session.user.serverAllianceId,
                registrationComplete: false
              },
              message: '회원가입이 필요합니다'
            }
          } else {
            // 정상 로그인 사용자
            return {
              status: 'login',
              user: {
                userId: parseInt(session.user.id),
                kakaoId: session.user.kakaoId || '',
                email: session.user.email || '',
                nickname: session.user.name || '',
                profileImageUrl: session.user.image,
                role: session.user.role || 'USER',
                status: 'ACTIVE',
                label: session.user.label,
                serverInfo: session.user.serverInfo,
                allianceTag: session.user.allianceTag,
                serverAllianceId: session.user.serverAllianceId,
                registrationComplete: session.user.registrationComplete || false
              },
              message: '로그인 성공'
            }
          }
        } else {
          throw new Error('NextAuth 세션 생성되었지만 사용자 정보 없음')
        }
      } else {
        throw new Error('NextAuth 세션 생성 실패: ' + (signInResult?.error || '알 수 없는 오류'))
      }
      
    } catch (error) {
      console.error('[authAPI] 로그인 실패:', error)
      throw error
    }
  },

  /**
   * 회원가입
   */
  async signup(request: SignupRequest): Promise<SignupResponse> {
    return fetchFromAPI<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  },

  /**
   * 테스트용 이메일 로그인 - NextAuth 플로우 사용 (OAuth 로그인과 동일)
   */
  async testLogin(request: TestLoginRequest): Promise<LoginResponse> {
    console.log('[authAPI] testLogin 시작:', request)
    
    try {
      // 1. 백엔드 API 호출로 로그인 처리
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/test/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          nickname: request.nickname
        })
      })
      
      const data = await response.json()
      console.log('[authAPI] 백엔드 테스트 로그인 응답:', data)
      
      if (!response.ok) {
        throw new Error(data.message || '테스트 로그인 요청 실패')
      }
      
      if (data.status === 'login') {
        // 2. NextAuth 세션 생성 (test provider 사용)
        const signInResult = await signIn('test', {
          email: data.user.email,
          nickname: data.user.nickname,
          redirect: false
        })
        
        console.log('[authAPI] NextAuth signIn 결과:', signInResult)
        
        if (signInResult?.ok) {
          return {
            status: 'login',
            user: {
              userId: data.user.userId,
              kakaoId: data.user.kakaoId || '',
              email: data.user.email,
              nickname: data.user.nickname,
              profileImageUrl: data.user.profileImageUrl,
              role: data.user.role || 'USER',
              status: 'ACTIVE',
              label: data.user.label,
              serverAllianceId: data.user.serverAllianceId,
              registrationComplete: data.user.registrationComplete
            },
            message: '로그인 성공'
          }
        } else {
          throw new Error('NextAuth 세션 생성 실패: ' + signInResult?.error)
        }
      }
      
      throw new Error('알 수 없는 응답 상태: ' + data.status)
      
    } catch (error) {
      console.error('[authAPI] 테스트 로그인 실패:', error)
      throw error
    }
  },

  /**
   * 세션 확인
   */
  async checkSession(): Promise<SessionCheckResponse> {
    const session = await getSession()
    
    if (session?.user) {
      return {
        valid: true,
        message: '유효한 세션입니다',
        user: {
          userId: parseInt(session.user.id),
          kakaoId: '',
          email: session.user.email || '',
          nickname: session.user.name || '',
          profileImageUrl: session.user.image,
          role: session.user.role || 'USER',
          status: 'ACTIVE',
          label: session.user.label,
          serverAllianceId: session.user.serverAllianceId,
          registrationComplete: session.user.registrationComplete || false
        }
      }
    }
    
    return {
      valid: false,
      message: '유효하지 않은 세션입니다'
    }
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 백엔드 로그아웃 API 호출 (JWT 쿠키 및 세션 정리)
      await fetchFromAPI('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('[authAPI] 백엔드 로그아웃 API 호출 실패:', error)
    }
    
    // 2. NextAuth 로그아웃
    await signOut({ redirect: false })
    
    // 3. 로컬 저장소 정리
    authStorage.clearAll()
    
    return { success: true, message: '로그아웃 되었습니다' }
  },

  /**
   * 현재 사용자 정보 조회 (NextAuth 세션 기반)
   */
  async getCurrentUser(): Promise<AccountInfo> {
    // NextAuth 세션에서 사용자 정보 조회 (serverInfo, allianceTag 포함)
    const session = await getSession()
    
    if (session?.user) {
      console.log('[authAPI] NextAuth 세션에서 사용자 정보 조회:', session.user)
      return {
        userId: parseInt(session.user.id),
        kakaoId: session.user.kakaoId || '',
        email: session.user.email || '',
        nickname: session.user.name || '',
        profileImageUrl: session.user.image,
        role: session.user.role || 'USER',
        status: 'ACTIVE',
        label: session.user.label,
        serverInfo: session.user.serverInfo,
        allianceTag: session.user.allianceTag,
        serverAllianceId: session.user.serverAllianceId,
        registrationComplete: session.user.registrationComplete || false
      }
    }
    
    throw new Error('로그인되지 않은 사용자입니다')
  },

  /**
   * 세션 정보 조회 (테스트용)
   */
  async getSessionInfo(): Promise<any> {
    return fetchFromAPI<any>('/auth/session/info')
  },

  /**
   * 닉네임 업데이트
   */
  async updateNickname(nickname: string): Promise<{ success: boolean; message: string }> {
    return fetchFromAPI<{ success: boolean; message: string }>('/auth/update-nickname', {
      method: 'PUT',
      body: JSON.stringify({ nickname })
    })
  },

}

// 토큰 및 사용자 정보 관리
export const authStorage = {

  /**
   * JWT 토큰 저장 (HttpOnly 쿠키로)
   */
  setTokens(accessToken: string, refreshToken: string): void {
    // HttpOnly 쿠키로 설정하기 위해 서버사이드에서 처리 필요
    // 임시로 일반 쿠키에 저장 (보안상 좋지 않지만 테스트용)
    document.cookie = `LASTWAR_JWT=${accessToken}; path=/; max-age=${24 * 60 * 60}; secure=false` // 1일
    document.cookie = `LASTWAR_REFRESH=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure=false` // 7일
  },

  /**
   * JWT 토큰 조회
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'LASTWAR_JWT') {
        return value
      }
    }
    return null
  },

  /**
   * 사용자 정보 저장
   */
  setUserInfo(user: AccountInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastwar_user', JSON.stringify(user))
    }
  },

  /**
   * 사용자 정보 조회
   */
  getUserInfo(): AccountInfo | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('lastwar_user')
    return userStr ? JSON.parse(userStr) : null
  },

  /**
   * 사용자 정보 삭제
   */
  removeUserInfo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastwar_user')
    }
  },

  /**
   * 모든 인증 정보 삭제
   */
  clearAll(): void {
    // 쿠키 삭제
    document.cookie = 'LASTWAR_JWT=; path=/; max-age=0'
    document.cookie = 'LASTWAR_REFRESH=; path=/; max-age=0'
    // localStorage 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastwar_user')
      sessionStorage.removeItem('signup_user_data')
    }
  }
}

// NextAuth 기반 유틸리티 함수들
export const authUtils = {
  /**
   * 현재 페이지 URL을 카카오 리다이렉트 URI로 생성
   */
  generateRedirectUri(): string {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/auth/kakao/callback`
  },

  /**
   * 사용자가 로그인되어 있는지 확인 (NextAuth 세션 기준)
   */
  isLoggedIn(): boolean {
    // 동기 버전 - 클라이언트에서 빠른 체크용
    if (typeof window === 'undefined') return false
    // localStorage 또는 document.cookie에서 next-auth 토큰 확인
    return document.cookie.includes('next-auth.session-token') || 
           document.cookie.includes('__Secure-next-auth.session-token')
  },

  /**
   * 사용자가 로그인되어 있는지 확인 (비동기 버전)
   */
  async isLoggedInAsync(): Promise<boolean> {
    const session = await getSession()
    return !!session?.user
  },

  /**
   * 사용자가 마스터 권한을 가지고 있는지 확인
   */
  async isMaster(): Promise<boolean> {
    const session = await getSession()
    return session?.user?.role === 'MASTER'
  },

  /**
   * 회원가입이 완료되었는지 확인
   */
  async isRegistrationComplete(): Promise<boolean> {
    const session = await getSession()
    return session?.user?.registrationComplete === true
  },

  /**
   * 현재 사용자의 server alliance ID 조회
   */
  async getCurrentServerAllianceId(): Promise<number | null> {
    const session = await getSession()
    return session?.user?.serverAllianceId || null
  },

  /**
   * 로그아웃 처리
   */
  async performLogout(): Promise<void> {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
    } finally {
      window.location.href = '/login'
    }
  }
}