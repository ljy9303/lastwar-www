import { fetchFromAPI } from './api-service'

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

export interface AllianceTagInfo {
  id: number
  serverNumber: number
  allianceTag: string
  memberCount: number
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
    return fetchFromAPI<LoginResponse>('/auth/kakao/login', {
      method: 'POST',
      body: JSON.stringify(request)
    })
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
   * 세션 확인
   */
  async checkSession(): Promise<SessionCheckResponse> {
    return fetchFromAPI<SessionCheckResponse>('/auth/session/check')
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return fetchFromAPI<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST'
    })
  },

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<AccountInfo> {
    return fetchFromAPI<AccountInfo>('/auth/me')
  },

  /**
   * 세션 정보 조회 (테스트용)
   */
  async getSessionInfo(): Promise<any> {
    return fetchFromAPI<any>('/auth/session/info')
  },

  /**
   * 특정 서버의 연맹 태그 목록 조회
   */
  async getAlliancesByServer(serverNumber: number): Promise<AllianceTagInfo[]> {
    return fetchFromAPI<AllianceTagInfo[]>(`/auth/server/${serverNumber}/alliances`)
  }
}

// 로컬 스토리지 관리
export const authStorage = {
  /**
   * 세션 ID 저장
   */
  setSessionId(sessionId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastwar_session_id', sessionId)
    }
  },

  /**
   * 세션 ID 조회
   */
  getSessionId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastwar_session_id')
    }
    return null
  },

  /**
   * 세션 ID 삭제
   */
  removeSessionId(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastwar_session_id')
    }
  },

  /**
   * 사용자 정보 저장
   */
  setUserInfo(user: AccountInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastwar_user_info', JSON.stringify(user))
    }
  },

  /**
   * 사용자 정보 조회
   */
  getUserInfo(): AccountInfo | null {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem('lastwar_user_info')
      return userInfo ? JSON.parse(userInfo) : null
    }
    return null
  },

  /**
   * 사용자 정보 삭제
   */
  removeUserInfo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastwar_user_info')
    }
  },

  /**
   * 모든 인증 정보 삭제
   */
  clearAll(): void {
    this.removeSessionId()
    this.removeUserInfo()
  }
}

// 유틸리티 함수들
export const authUtils = {
  /**
   * 현재 페이지 URL을 카카오 리다이렉트 URI로 생성
   */
  generateRedirectUri(): string {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/auth/kakao/callback`
  },

  /**
   * 사용자가 로그인되어 있는지 확인
   */
  isLoggedIn(): boolean {
    return authStorage.getSessionId() !== null
  },

  /**
   * 사용자가 마스터 권한을 가지고 있는지 확인
   */
  isMaster(): boolean {
    const user = authStorage.getUserInfo()
    return user?.role === 'MASTER'
  },

  /**
   * 회원가입이 완료되었는지 확인
   */
  isRegistrationComplete(): boolean {
    const user = authStorage.getUserInfo()
    return user?.registrationComplete === true
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
      authStorage.clearAll()
      window.location.href = '/login'
    }
  }
}