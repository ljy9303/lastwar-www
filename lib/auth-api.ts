import { fetchFromAPI } from './api-service'
import { signIn, signOut, getSession } from "next-auth/react"

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
}

export interface SignupRequest {
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
   * 카카오 OAuth 로그인
   */
  async kakaoLogin(request: LoginRequest): Promise<LoginResponse> {
    const result = await signIn('kakao', {
      code: request.code,
      redirectUri: request.redirectUri,
      redirect: false
    })
    
    if (result?.ok) {
      const session = await getSession()
      return {
        status: 'login',
        user: {
          userId: parseInt(session?.user?.id || '0'),
          kakaoId: '',
          email: session?.user?.email || '',
          nickname: session?.user?.name || '',
          profileImageUrl: session?.user?.image,
          role: session?.user?.role || 'USER',
          status: 'ACTIVE',
          serverAllianceId: session?.user?.serverAllianceId,
          registrationComplete: session?.user?.registrationComplete || false
        },
        message: '로그인 성공'
      }
    }
    
    throw new Error('로그인 실패')
  },

  /**
   * 회원가입 (기존 API - 호환성 유지)
   */
  async signup(request: SignupRequest): Promise<SignupResponse> {
    return fetchFromAPI<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  },

  /**
   * 프로필 완성 (새로운 OAuth 플로우)
   */
  async completeProfile(request: SignupRequest): Promise<SignupResponse> {
    return fetchFromAPI<SignupResponse>('/auth/profile/complete', {
      method: 'PUT',
      body: JSON.stringify(request)
    })
  },

  /**
   * 테스트용 이메일 로그인
   */
  async testLogin(request: TestLoginRequest): Promise<LoginResponse> {
    const result = await signIn('test', {
      email: request.email,
      nickname: request.nickname,
      redirect: false
    })
    
    if (result?.ok) {
      const session = await getSession()
      return {
        status: 'login',
        user: {
          userId: parseInt(session?.user?.id || '0'),
          kakaoId: '',
          email: session?.user?.email || '',
          nickname: session?.user?.name || '',
          profileImageUrl: session?.user?.image,
          role: session?.user?.role || 'USER',
          status: 'ACTIVE',
          serverAllianceId: session?.user?.serverAllianceId,
          registrationComplete: session?.user?.registrationComplete || false
        },
        message: '로그인 성공'
      }
    }
    
    throw new Error('로그인 실패')
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
    await signOut({ redirect: false })
    return { success: true, message: '로그아웃 되었습니다' }
  },

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<AccountInfo> {
    const session = await getSession()
    
    if (session?.user) {
      return {
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
    }
    
    throw new Error('로그인되지 않은 사용자입니다')
  },

  /**
   * 세션 정보 조회 (테스트용)
   */
  async getSessionInfo(): Promise<any> {
    return fetchFromAPI<any>('/auth/session/info')
  },

}

// NextAuth 기반 스토리지 관리 (NextAuth가 자동으로 관리)
export const authStorage = {

  /**
   * 사용자 정보 저장 (NextAuth가 자동 관리)
   */
  setUserInfo(user: AccountInfo): void {
    // NextAuth가 자동으로 관리하므로 별도 저장 불필요
  },

  /**
   * 사용자 정보 조회 (NextAuth에서 조회)
   */
  getUserInfo(): AccountInfo | null {
    // NextAuth를 통해 실시간으로 조회해야 하므로 null 반환
    return null
  },

  /**
   * 사용자 정보 삭제 (NextAuth가 자동 관리)
   */
  removeUserInfo(): void {
    // NextAuth가 자동으로 관리하므로 별도 삭제 불필요
  },

  /**
   * 모든 인증 정보 삭제 (NextAuth가 자동 관리)
   */
  clearAll(): void {
    // NextAuth가 자동으로 관리하므로 별도 삭제 불필요
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
  async isLoggedIn(): Promise<boolean> {
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