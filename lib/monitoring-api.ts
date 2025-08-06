import { fetchFromAPI } from './api-service'
import { createLogger } from './logger'

const logger = createLogger('monitoringAPI')

// 모니터링 API 응답 타입 정의
export interface ActiveUsersResponse {
  totalActiveUsers: number
  activeUsersByTenant: Record<string, number>
  systemInfo: {
    sessionTimeout: number
    lastUpdated: string
  }
}

export interface UserMonitoringInfo {
  userId: number
  nickname: string  // 마스킹됨: "테***자"
  serverAllianceId: number
  loginTime: string // ISO datetime
  sessionId: string // 마스킹됨: "ABC1****456" 
  lastActivity: string // ISO datetime
}

export interface TenantActiveUsersResponse {
  [serverAllianceId: string]: number
}

// 모니터링 API 서비스
export const monitoringAPI = {
  /**
   * 전체 활성 사용자 수 조회
   */
  async getActiveUsers(): Promise<ActiveUsersResponse> {
    try {
      logger.debug('활성 사용자 수 조회 요청')
      const response = await fetchFromAPI<ActiveUsersResponse>('/actuator/active-users')
      logger.debug('활성 사용자 수 조회 성공:', response)
      return response
    } catch (error) {
      logger.error('활성 사용자 수 조회 실패:', error)
      throw error
    }
  },

  /**
   * 상세 사용자 정보 조회 (관리자용)
   * MASTER 권한이 필요한 API
   */
  async getActiveUsersDetail(): Promise<UserMonitoringInfo[]> {
    try {
      logger.debug('상세 사용자 정보 조회 요청 (관리자용)')
      const response = await fetchFromAPI<UserMonitoringInfo[]>('/actuator/active-users/detail')
      logger.debug('상세 사용자 정보 조회 성공:', response)
      return response
    } catch (error) {
      logger.error('상세 사용자 정보 조회 실패:', error)
      throw error
    }
  },

  /**
   * 테넌트별 활성 사용자 수 조회
   */
  async getActiveUsersByTenant(): Promise<TenantActiveUsersResponse> {
    try {
      logger.debug('테넌트별 활성 사용자 수 조회 요청')
      const response = await fetchFromAPI<TenantActiveUsersResponse>('/actuator/active-users/by-tenant')
      logger.debug('테넌트별 활성 사용자 수 조회 성공:', response)
      return response
    } catch (error) {
      logger.error('테넌트별 활성 사용자 수 조회 실패:', error)
      throw error
    }
  },

  /**
   * 현재 세션 정보 조회 (디버깅용)
   */
  async getMySessionInfo(): Promise<UserMonitoringInfo | null> {
    try {
      logger.debug('현재 세션 정보 조회 요청')
      const response = await fetchFromAPI<UserMonitoringInfo>('/actuator/active-users/my-session')
      logger.debug('현재 세션 정보 조회 성공:', response)
      return response
    } catch (error) {
      // 세션이 없는 경우는 에러가 아닌 null 반환
      if (error instanceof Error && 'status' in error && (error as any).status === 404) {
        logger.debug('현재 활성 세션 없음')
        return null
      }
      logger.error('현재 세션 정보 조회 실패:', error)
      throw error
    }
  },

  /**
   * 세션 상태 확인 (로그인/로그아웃 연동용)
   */
  async checkSessionStatus(): Promise<{ hasActiveSession: boolean; sessionInfo?: UserMonitoringInfo }> {
    try {
      const sessionInfo = await this.getMySessionInfo()
      return {
        hasActiveSession: sessionInfo !== null,
        sessionInfo: sessionInfo || undefined
      }
    } catch (error) {
      logger.error('세션 상태 확인 실패:', error)
      return { hasActiveSession: false }
    }
  }
}

// 모니터링 유틸리티 함수들
export const monitoringUtils = {
  /**
   * 닉네임 마스킹 해제 (클라이언트에서는 불가능, 표시용)
   */
  formatNickname(maskedNickname: string): string {
    return maskedNickname // 백엔드에서 이미 마스킹되어 옴
  },

  /**
   * 세션 ID 포맷팅 (마스킹된 형태로 표시)
   */
  formatSessionId(maskedSessionId: string): string {
    return maskedSessionId // 백엔드에서 이미 마스킹되어 옴
  },

  /**
   * 로그인 시간 포맷팅
   */
  formatLoginTime(loginTime: string): string {
    const date = new Date(loginTime)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  /**
   * 최근 활동 시간 포맷팅
   */
  formatLastActivity(lastActivity: string): string {
    const date = new Date(lastActivity)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) {
      return '방금 전'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`
    } else if (diffMinutes < 1440) { // 24시간
      const diffHours = Math.floor(diffMinutes / 60)
      return `${diffHours}시간 전`
    } else {
      return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  /**
   * 세션 타임아웃까지 남은 시간 계산
   */
  calculateSessionTimeLeft(lastActivity: string, sessionTimeoutMinutes: number): string {
    const lastActivityDate = new Date(lastActivity)
    const timeoutDate = new Date(lastActivityDate.getTime() + (sessionTimeoutMinutes * 60 * 1000))
    const now = new Date()
    const timeLeft = timeoutDate.getTime() - now.getTime()
    
    if (timeLeft <= 0) {
      return '만료됨'
    }
    
    const minutesLeft = Math.floor(timeLeft / (1000 * 60))
    const hoursLeft = Math.floor(minutesLeft / 60)
    
    if (hoursLeft > 0) {
      return `${hoursLeft}시간 ${minutesLeft % 60}분 남음`
    } else {
      return `${minutesLeft}분 남음`
    }
  }
}

// 타입 가드 함수들
export function isActiveUsersResponse(obj: any): obj is ActiveUsersResponse {
  return obj && 
         typeof obj.totalActiveUsers === 'number' &&
         typeof obj.activeUsersByTenant === 'object' &&
         obj.systemInfo &&
         typeof obj.systemInfo.sessionTimeout === 'number' &&
         typeof obj.systemInfo.lastUpdated === 'string'
}

export function isUserMonitoringInfo(obj: any): obj is UserMonitoringInfo {
  return obj &&
         typeof obj.userId === 'number' &&
         typeof obj.nickname === 'string' &&
         typeof obj.serverAllianceId === 'number' &&
         typeof obj.loginTime === 'string' &&
         typeof obj.sessionId === 'string' &&
         typeof obj.lastActivity === 'string'
}