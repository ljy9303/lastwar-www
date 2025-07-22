/**
 * 채팅 로컬 스토리지 관리
 * 마지막 읽은 메시지 시점 저장/조회
 */

const STORAGE_KEY = 'lastwar_chat_last_read'

export interface LastReadInfo {
  global: number | null
  inquiry: number | null
}

/**
 * 마지막 읽은 메시지 시점 저장
 */
export function saveLastReadMessage(roomType: 'GLOBAL' | 'INQUIRY', messageId: number): void {
  try {
    const current = getLastReadMessages()
    const updated = {
      ...current,
      [roomType.toLowerCase()]: messageId
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    console.log('💾 마지막 읽은 메시지 저장:', roomType, messageId)
  } catch (error) {
    console.warn('로컬 스토리지 저장 실패:', error)
  }
}

/**
 * 마지막 읽은 메시지 시점 조회
 */
export function getLastReadMessages(): LastReadInfo {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('로컬 스토리지 조회 실패:', error)
  }
  
  return {
    global: null,
    inquiry: null
  }
}

/**
 * 특정 룸의 마지막 읽은 메시지 ID 조회
 */
export function getLastReadMessageId(roomType: 'GLOBAL' | 'INQUIRY'): number | null {
  const lastRead = getLastReadMessages()
  return lastRead[roomType.toLowerCase() as keyof LastReadInfo]
}

/**
 * 미열람 메시지 여부 확인
 */
export function hasUnreadMessages(roomType: 'GLOBAL' | 'INQUIRY', latestMessageId: number): boolean {
  const lastReadId = getLastReadMessageId(roomType)
  
  if (lastReadId === null) {
    // 처음 사용하는 경우 미열람으로 간주
    return true
  }
  
  return latestMessageId > lastReadId
}

/**
 * 로컬 스토리지 초기화 (테스트용)
 */
export function clearChatStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ 채팅 로컬 스토리지 초기화 완료')
  } catch (error) {
    console.warn('로컬 스토리지 초기화 실패:', error)
  }
}