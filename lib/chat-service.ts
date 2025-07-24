/**
 * 채팅 API 서비스
 * 백엔드 채팅 API와 통신하는 클라이언트 서비스
 */

import { fetchFromAPI } from "@/lib/api-service"
import { getSession } from "next-auth/react"

export interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userTag?: string
  userLabel?: string
  serverTag?: number
  allianceName?: string // 연맹 이름
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE" | "IMAGE" | "FILE"
  roomType: "GLOBAL" | "INQUIRY"
  isMyMessage: boolean
  timeDisplay: string
  deleted: boolean
  serverAllianceId: number
  userServer?: number // 사용자 서버 번호
  // ADMIN 기능 추가
  hiddenByAdmin?: boolean
  hiddenAt?: string
  hiddenByUserSeq?: number
  hiddenReason?: string
}

export interface ChatHistoryRequest {
  roomType: "GLOBAL" | "INQUIRY"
  lastMessageId?: number
  afterMessageId?: number // 캐시 이후 새로운 메시지 조회용
  size?: number
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
  hasMore: boolean
  nextLastMessageId?: number
  totalCount?: number
}

export interface SendMessageRequest {
  roomType: "GLOBAL" | "INQUIRY"
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  content: string
}

export interface SendMessageResponse extends ChatMessage {}

/**
 * 채팅 서비스 클래스
 */
export class ChatService {
  
  /**
   * 채팅 히스토리 조회 (무한스크롤용)
   * 
   * @param request 히스토리 조회 요청
   * @returns 채팅 히스토리 응답
   */
  static async getChatHistory(request: ChatHistoryRequest): Promise<ChatHistoryResponse> {
    try {
      // 인증 상태 사전 체크
      const session = await getSession()
      if (!session?.user || !session?.accessToken) {
        console.warn('[CHAT-API] 인증되지 않은 사용자 - 채팅 히스토리 접근 차단')
        throw new Error('채팅 서비스는 로그인이 필요합니다. 로그인 후 이용해주세요.')
      }
      
      console.log('[CHAT-API] 히스토리 조회 요청:', request)
      
      const requestBody = {
        roomType: request.roomType,
        lastMessageId: request.lastMessageId || null,
        afterMessageId: request.afterMessageId || null, // 캐시 이후 메시지 조회용
        size: request.size || 20
      }
      
      console.log('[CHAT-API] 요청 바디:', requestBody)
      
      // fetchFromAPI를 사용하여 자동으로 인증 헤더와 에러 처리
      const data = await fetchFromAPI<ChatHistoryResponse>('/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('[CHAT-API] 백엔드 응답 데이터:', data)
      
      // 응답 데이터 구조 검증
      if (!data || typeof data !== 'object') {
        console.error('[CHAT-API] 응답 데이터가 올바르지 않음:', data)
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }

      // messages 배열이 없거나 배열이 아닌 경우 빈 배열로 초기화
      const messages = Array.isArray(data.messages) ? data.messages : []
      console.log('[CHAT-API] 메시지 개수:', messages.length)
      
      // 시간순 정렬 (오래된 것부터)
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      const result: ChatHistoryResponse = {
        messages: sortedMessages,
        hasMore: data.hasMore || false,
        nextLastMessageId: data.nextLastMessageId,
        totalCount: data.totalCount
      }
      
      console.log('[CHAT-API] 최종 응답:', result)
      return result
    } catch (error) {
      console.error('[CHAT-API] 채팅 히스토리 조회 오류:', error)
      
      // 구체적인 오류 메시지 제공
      if (error instanceof Error) {
        // fetchFromAPI에서 던진 구조화된 에러인지 확인
        const apiError = error as Error & { status?: number; data?: any }
        if (apiError.status) {
          console.error('[CHAT-API] API 오류 상태:', apiError.status, 'Data:', apiError.data)
          throw new Error(`채팅 히스토리 조회 실패 (${apiError.status}): ${error.message}`)
        }
      }
      
      throw new Error(`채팅 히스토리 조회 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 메시지 전송 (REST API)
   * WebSocket 연결이 불안정한 경우 대안으로 사용
   * 
   * @param request 메시지 전송 요청
   * @returns 전송된 메시지 정보
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      // 인증 상태 사전 체크
      const session = await getSession()
      if (!session?.user || !session?.accessToken) {
        console.warn('[CHAT-API] 인증되지 않은 사용자 - 메시지 전송 차단')
        throw new Error('메시지 전송은 로그인이 필요합니다. 로그인 후 이용해주세요.')
      }
      
      console.log('[CHAT-API] 메시지 전송 요청:', request)
      
      const data = await fetchFromAPI<SendMessageResponse>('/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      
      console.log('[CHAT-API] 메시지 전송 성공:', data)
      return data
    } catch (error) {
      console.error('[CHAT-API] 메시지 전송 오류:', error)
      
      // 구체적인 오류 메시지 제공
      if (error instanceof Error) {
        const apiError = error as Error & { status?: number; data?: any }
        if (apiError.status) {
          throw new Error(`메시지 전송 실패 (${apiError.status}): ${error.message}`)
        }
      }
      
      throw new Error(`메시지 전송 실패: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 채팅방 입장
   * 
   * @param roomType 채팅방 유형
   */
  static async joinChatRoom(roomType: "GLOBAL" | "INQUIRY"): Promise<void> {
    try {
      // 인증 상태 사전 체크
      const session = await getSession()
      if (!session?.user || !session?.accessToken) {
        console.warn('[CHAT-API] 인증되지 않은 사용자 - 채팅방 입장 차단')
        throw new Error('채팅방 입장은 로그인이 필요합니다. 로그인 후 이용해주세요.')
      }
      
      console.log(`[CHAT-API] 채팅방 입장 요청: ${roomType}`)
      
      await fetchFromAPI(`/chat/join/${roomType.toLowerCase()}`, {
        method: 'POST'
      })
      
      console.log(`[CHAT-API] 채팅방 입장 성공: ${roomType}`)
    } catch (error) {
      console.error(`[CHAT-API] 채팅방 입장 오류 (${roomType}):`, error)
      
      // 구체적인 오류 메시지 제공
      if (error instanceof Error) {
        const apiError = error as Error & { status?: number; data?: any }
        if (apiError.status) {
          throw new Error(`채팅방 입장 실패 (${apiError.status}): ${error.message}`)
        }
      }
      
      throw new Error(`채팅방 입장 실패: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 채팅방 퇴장
   * 
   * @param roomType 채팅방 유형
   */
  static async leaveChatRoom(roomType: "GLOBAL" | "INQUIRY"): Promise<void> {
    try {
      // 인증 상태 사전 체크
      const session = await getSession()
      if (!session?.user || !session?.accessToken) {
        console.warn('[CHAT-API] 인증되지 않은 사용자 - 채팅방 퇴장 차단')
        throw new Error('채팅방 퇴장은 로그인이 필요합니다. 로그인 후 이용해주세요.')
      }
      
      console.log(`[CHAT-API] 채팅방 퇴장 요청: ${roomType}`)
      
      await fetchFromAPI(`/chat/leave/${roomType.toLowerCase()}`, {
        method: 'POST'
      })
      
      console.log(`[CHAT-API] 채팅방 퇴장 성공: ${roomType}`)
    } catch (error) {
      console.error(`[CHAT-API] 채팅방 퇴장 오류 (${roomType}):`, error)
      
      // 구체적인 오류 메시지 제공
      if (error instanceof Error) {
        const apiError = error as Error & { status?: number; data?: any }
        if (apiError.status) {
          throw new Error(`채팅방 퇴장 실패 (${apiError.status}): ${error.message}`)
        }
      }
      
      throw new Error(`채팅방 퇴장 실패: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 메시지 시간 포맷팅 (카카오톡 스타일)
   * 
   * @param createdAt 메시지 생성 시간
   * @returns 포맷된 시간 문자열
   */
  static formatTimeDisplay(createdAt: string): string {
    const messageTime = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
      return "방금 전"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`
    } else {
      return messageTime.toLocaleDateString('ko-KR', {
        month: 'numeric',
        day: 'numeric'
      })
    }
  }

  /**
   * 전투력 포맷팅 (M/B 단위)
   * 
   * @param power 전투력 값
   * @returns 포맷된 전투력 문자열
   */
  static formatPower(power: number): string {
    if (power === 0) return "0"
    if (power < 1) {
      return `${(power * 100).toFixed(0)}만`
    }
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)}B`
    }
    if (power >= 100) {
      return `${power.toFixed(0)}M`
    }
    return `${power.toFixed(1)}M`
  }

  /**
   * 연맹등급 색상 매핑
   * 
   * @param userGrade 연맹등급
   * @returns Tailwind CSS 색상 클래스
   */
  static getGradeColor(userGrade?: string): string {
    switch (userGrade) {
      case 'R5': return 'text-red-600 border-red-300 bg-red-50'
      case 'R4': return 'text-orange-600 border-orange-300 bg-orange-50'
      case 'R3': return 'text-yellow-600 border-yellow-300 bg-yellow-50'
      case 'R2': return 'text-green-600 border-green-300 bg-green-50'
      case 'R1': return 'text-blue-600 border-blue-300 bg-blue-50'
      default: return 'text-gray-600 border-gray-300 bg-gray-50'
    }
  }

  /**
   * 메시지 타입별 아이콘 매핑
   * 
   * @param messageType 메시지 타입
   * @returns 아이콘 문자열 또는 이모지
   */
  static getMessageTypeIcon(messageType: string): string {
    switch (messageType) {
      case 'SYSTEM': return '📢'
      case 'JOIN': return '👋'
      case 'LEAVE': return '👋'
      case 'IMAGE': return '🖼️'
      case 'FILE': return '📎'
      default: return ''
    }
  }
}

// ADMIN 관련 타입 정의

export interface ChatRestrictionType {
  READ_ONLY: "READ_ONLY"
  MUTED: "MUTED" 
  BANNED: "BANNED"
}

export interface ChatUserRestriction {
  restrictionId: number
  userSeq: number
  roomType: "GLOBAL" | "INQUIRY"
  restrictionType: "READ_ONLY" | "MUTED" | "BANNED"
  restrictedByUserSeq: number
  restrictedAt: string
  restrictionReason?: string
  expiresAt?: string
  active: boolean
  serverAllianceId: number
  createdAt: string
  updatedAt: string
}

export interface RestrictUserRequest {
  targetUserSeq: number
  roomType: "GLOBAL" | "INQUIRY"
  restrictionType: "READ_ONLY" | "MUTED" | "BANNED"
  reason?: string
  durationMinutes?: number // null이면 영구
}

export interface UnrestrictUserRequest {
  targetUserSeq: number
  roomType: "GLOBAL" | "INQUIRY"
}

export interface HideMessageRequest {
  messageId: number
  reason?: string
}

export interface HideMessagesRequest {
  messageIds: number[]
  reason?: string
}

export interface UnhideMessagesRequest {
  messageIds: number[]
}

export interface AdminResponse<T> {
  success: boolean
  message: string
  data?: T
}

/**
 * ADMIN 전용 채팅 관리 API 서비스
 */
export class ChatAdminService {
  
  /**
   * 사용자 채팅 제한 적용
   */
  static async restrictUser(request: RestrictUserRequest): Promise<AdminResponse<ChatUserRestriction>> {
    try {
      const data = await fetchFromAPI<AdminResponse<ChatUserRestriction>>('/admin/chat/restrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 사용자 제한 적용 실패:', error)
      throw error
    }
  }

  /**
   * 사용자 채팅 제한 해제
   */
  static async unrestrictUser(request: UnrestrictUserRequest): Promise<AdminResponse<void>> {
    try {
      const data = await fetchFromAPI<AdminResponse<void>>('/admin/chat/unrestrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 사용자 제한 해제 실패:', error)
      throw error
    }
  }

  /**
   * 활성 제한 목록 조회
   */
  static async getActiveRestrictions(roomType: "GLOBAL" | "INQUIRY", page = 0, size = 20): Promise<{
    content: ChatUserRestriction[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }> {
    try {
      const data = await fetchFromAPI<{
        content: ChatUserRestriction[]
        totalElements: number
        totalPages: number
        number: number
        size: number
      }>(`/admin/chat/restrictions?roomType=${roomType}&page=${page}&size=${size}`)

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 활성 제한 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 사용자 제한 히스토리 조회
   */
  static async getUserRestrictionHistory(userSeq: number): Promise<ChatUserRestriction[]> {
    try {
      const data = await fetchFromAPI<ChatUserRestriction[]>(`/admin/chat/restrictions/user/${userSeq}`)

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 사용자 제한 히스토리 조회 실패:', error)
      throw error
    }
  }

  /**
   * 메시지 가리기
   */
  static async hideMessage(request: HideMessageRequest): Promise<AdminResponse<ChatMessage>> {
    try {
      const data = await fetchFromAPI<AdminResponse<ChatMessage>>('/admin/chat/messages/hide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 메시지 가리기 실패:', error)
      throw error
    }
  }

  /**
   * 다중 메시지 가리기
   */
  static async hideMessages(request: HideMessagesRequest): Promise<AdminResponse<{hiddenMessages: ChatMessage[], processedCount: number}>> {
    try {
      const data = await fetchFromAPI<AdminResponse<{hiddenMessages: ChatMessage[], processedCount: number}>>('/admin/chat/messages/hide/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 다중 메시지 가리기 실패:', error)
      throw error
    }
  }

  /**
   * 다중 메시지 가리기 해제
   */
  static async unhideMessages(request: UnhideMessagesRequest): Promise<AdminResponse<{unhiddenMessages: ChatMessage[], processedCount: number}>> {
    try {
      const data = await fetchFromAPI<AdminResponse<{unhiddenMessages: ChatMessage[], processedCount: number}>>('/admin/chat/messages/unhide/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 다중 메시지 가리기 해제 실패:', error)
      throw error
    }
  }

  /**
   * 메시지 가리기 해제
   */
  static async unhideMessage(messageId: number): Promise<AdminResponse<ChatMessage>> {
    try {
      const data = await fetchFromAPI<AdminResponse<ChatMessage>>(`/admin/chat/messages/${messageId}/unhide`, {
        method: 'POST'
      })

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 메시지 가리기 해제 실패:', error)
      throw error
    }
  }

  /**
   * 가려진 메시지 목록 조회
   */
  static async getHiddenMessages(roomType?: "GLOBAL" | "INQUIRY", page = 0, size = 20): Promise<{
    content: ChatMessage[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      })
      
      if (roomType) {
        params.append('roomType', roomType)
      }

      const data = await fetchFromAPI<{
        content: ChatMessage[]
        totalElements: number
        totalPages: number
        number: number
        size: number
      }>(`/admin/chat/messages/hidden?${params}`)

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 가려진 메시지 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 관리자 활동 로그 조회
   */
  static async getAdminActivity(adminUserSeq?: number): Promise<ChatUserRestriction[]> {
    try {
      const params = adminUserSeq ? `?adminUserSeq=${adminUserSeq}` : ''
      const data = await fetchFromAPI<ChatUserRestriction[]>(`/admin/chat/activity${params}`)

      return data
    } catch (error) {
      console.error('[ADMIN-CHAT] 관리자 활동 로그 조회 실패:', error)
      throw error
    }
  }
}