import { useSession } from 'next-auth/react'

/**
 * 사용자 행동 추적 로그 유틸리티
 */
export class UserLogger {
  private static getUserInfo() {
    if (typeof window === 'undefined') return null
    
    // 세션 정보에서 사용자 정보 가져오기
    const session = (window as any).__NEXT_AUTH_SESSION
    if (session?.user) {
      return {
        nickname: session.user.nickname || session.user.name,
        serverInfo: session.user.serverInfo,
        allianceTag: session.user.allianceTag,
        userId: session.user.id
      }
    }
    return null
  }

  private static formatUserInfo(user: any) {
    if (!user) return '미인증사용자'
    
    const serverInfo = user.serverInfo ? `${user.serverInfo}서버` : '미설정'
    const allianceTag = user.allianceTag || '미설정'
    const nickname = user.nickname || '익명'
    
    return `${nickname}(${serverInfo}-${allianceTag})`
  }

  /**
   * 페이지 방문 로그
   */
  static pageVisit(pageName: string, additionalInfo?: any) {
    // 로그 출력 제거
  }

  /**
   * 사용자 액션 로그
   */
  static userAction(action: string, target?: string, additionalInfo?: any) {
    // 로그 출력 제거
  }

  /**
   * 데이터 조회 로그
   */
  static dataAccess(dataType: string, params?: any) {
    // 로그 출력 제거
  }

  /**
   * 데이터 수정 로그
   */
  static dataModify(action: string, target: string, changes?: any) {
    // 로그 출력 제거
  }

  /**
   * 오류 발생 로그
   */
  static error(errorContext: string, error: any) {
    // 로그 출력 제거
  }
}

/**
 * React Hook으로 사용할 수 있는 사용자 로거
 */
export function useUserLogger() {
  const { data: session } = useSession()
  const user = session?.user
  
  const formatUserInfo = () => {
    if (!user) return '미인증사용자'
    
    const serverInfo = user.serverInfo ? `${user.serverInfo}서버` : '미설정'
    const allianceTag = user.allianceTag || '미설정'
    const nickname = user.nickname || user.name || '익명'
    
    return `${nickname}(${serverInfo}-${allianceTag})`
  }

  return {
    pageVisit: (pageName: string, additionalInfo?: any) => {
      // 로그 출력 제거
    },
    
    userAction: (action: string, target?: string, additionalInfo?: any) => {
      // 로그 출력 제거
    },
    
    dataAccess: (dataType: string, params?: any) => {
      // 로그 출력 제거
    },
    
    dataModify: (action: string, target: string, changes?: any) => {
      // 로그 출력 제거
    },
    
    error: (errorContext: string, error: any) => {
      // 로그 출력 제거
    }
  }
}