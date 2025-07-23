/**
 * 인증 관련 유틸리티 함수들
 */

import { useSession } from "next-auth/react"

/**
 * ADMIN 권한 확인 훅
 */
export function useIsAdmin() {
  const { data: session } = useSession()
  return session?.user?.role === 'ADMIN'
}

/**
 * ADMIN 권한 확인 함수 (세션 객체 직접 사용)
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === 'ADMIN'
}

/**
 * 현재 사용자 정보 가져오기
 */
export function useCurrentUser() {
  const { data: session } = useSession()
  return {
    userSeq: session?.user?.id ? parseInt(session.user.id) : null,
    userName: session?.user?.name || session?.user?.nickname || null,
    role: session?.user?.role || null,
    serverAllianceId: session?.user?.serverAllianceId || null,
    serverInfo: session?.user?.serverInfo || null,
    allianceTag: session?.user?.allianceTag || null,
    isAdmin: session?.user?.role === 'ADMIN'
  }
}