/**
 * 채팅 API 서비스
 * 백엔드 채팅 API와 통신하는 클라이언트 서비스
 */

import { fetchFromAPI } from "@/lib/api-service"

export interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userGrade?: string
  content: string
  createdAt: string
  updatedAt?: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE" | "IMAGE" | "FILE"
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  isMyMessage: boolean
  timeDisplay: string
  deleted: boolean
  readCount: number
  parentMessageId?: number
  serverAllianceId: number
}

export interface ChatHistoryRequest {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  lastMessageId?: number
  size?: number
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
  hasMore: boolean
  nextLastMessageId?: number
  totalCount?: number
}

export interface SendMessageRequest {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  content: string
  parentMessageId?: number
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
      const response = await fetchFromAPI('/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomType: request.roomType,
          lastMessageId: request.lastMessageId || null,
          size: request.size || 20
        })
      })

      if (!response.ok) {
        throw new Error(`채팅 히스토리 조회 실패: ${response.status}`)
      }

      const data: ChatHistoryResponse = await response.json()
      
      // 시간순 정렬 (오래된 것부터)
      const sortedMessages = data.messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      return {
        ...data,
        messages: sortedMessages
      }
    } catch (error) {
      console.error('채팅 히스토리 조회 오류:', error)
      throw error
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
      const response = await fetchFromAPI('/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`메시지 전송 실패: ${response.status}`)
      }

      const data: SendMessageResponse = await response.json()
      return data
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      throw error
    }
  }

  /**
   * 채팅방 입장
   * 
   * @param roomType 채팅방 유형
   */
  static async joinChatRoom(roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"): Promise<void> {
    try {
      const response = await fetchFromAPI(`/chat/join/${roomType.toLowerCase()}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`채팅방 입장 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('채팅방 입장 오류:', error)
      throw error
    }
  }

  /**
   * 채팅방 퇴장
   * 
   * @param roomType 채팅방 유형
   */
  static async leaveChatRoom(roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"): Promise<void> {
    try {
      const response = await fetchFromAPI(`/chat/leave/${roomType.toLowerCase()}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`채팅방 퇴장 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('채팅방 퇴장 오류:', error)
      throw error
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