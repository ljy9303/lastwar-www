/**
 * 채팅 메시지 관련 유틸리티 함수들
 */

/**
 * 문자열의 UTF-8 바이트 길이를 계산합니다.
 * 다국어 문자(한글, 중국어, 아랍어, 이모지 등)의 실제 바이트 크기를 정확히 측정합니다.
 * 
 * @param str 측정할 문자열
 * @returns UTF-8 바이트 길이
 * 
 * @example
 * getByteLength("Hello") // 5 (영어 1바이트 * 5)
 * getByteLength("안녕하세요") // 15 (한글 3바이트 * 5)
 * getByteLength("😀😀😀") // 12 (이모지 4바이트 * 3)
 */
export const getByteLength = (str: string): number => {
  if (!str) return 0
  return new TextEncoder().encode(str).length
}

/**
 * 메시지 바이트 길이 제한 상수
 */
export const MESSAGE_BYTE_LIMIT = 3000 // 3KB

/**
 * 메시지가 바이트 길이 제한을 초과하는지 확인합니다.
 * 
 * @param message 확인할 메시지
 * @returns 제한 초과 여부
 */
export const isMessageTooLong = (message: string): boolean => {
  return getByteLength(message) > MESSAGE_BYTE_LIMIT
}

/**
 * 바이트 크기를 사용자 친화적인 형태로 포맷합니다.
 * 
 * @param bytes 바이트 크기
 * @returns 포맷된 문자열
 * 
 * @example
 * formatByteSize(1500) // "1.5KB"
 * formatByteSize(500) // "500B"
 */
export const formatByteSize = (bytes: number): string => {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  }
  return `${bytes}B`
}

/**
 * 메시지 바이트 길이에 따른 상태를 반환합니다.
 * 
 * @param byteLength 현재 바이트 길이
 * @returns 상태 정보
 */
export const getMessageLengthStatus = (byteLength: number) => {
  const percentage = (byteLength / MESSAGE_BYTE_LIMIT) * 100
  
  let status: 'safe' | 'warning' | 'danger' = 'safe'
  let color = 'text-gray-500'
  
  if (percentage >= 100) {
    status = 'danger'
    color = 'text-red-500'
  } else if (percentage >= 80) {
    status = 'warning'
    color = 'text-yellow-500'
  }
  
  return {
    status,
    color,
    percentage: Math.min(percentage, 100),
    isOverLimit: byteLength > MESSAGE_BYTE_LIMIT
  }
}

/**
 * 메시지를 바이트 길이 제한에 맞게 자릅니다.
 * UTF-8 문자 경계를 고려하여 안전하게 자릅니다.
 * 
 * @param message 원본 메시지
 * @param maxBytes 최대 바이트 길이 (기본값: MESSAGE_BYTE_LIMIT)
 * @returns 잘린 메시지
 */
export const truncateMessageByBytes = (message: string, maxBytes: number = MESSAGE_BYTE_LIMIT): string => {
  if (getByteLength(message) <= maxBytes) {
    return message
  }
  
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  // 이진 탐색으로 최적 길이 찾기
  let left = 0
  let right = message.length
  let bestLength = 0
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const substring = message.substring(0, mid)
    const byteLength = encoder.encode(substring).length
    
    if (byteLength <= maxBytes) {
      bestLength = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  
  return message.substring(0, bestLength)
}

/**
 * 문자 타입별 바이트 크기 예시를 반환합니다.
 * 사용자 교육용으로 활용할 수 있습니다.
 */
export const getCharacterByteSizeExamples = () => {
  return [
    { type: '영어/숫자', example: 'A', bytes: 1 },
    { type: '한글', example: '가', bytes: 3 },
    { type: '중국어', example: '中', bytes: 3 },
    { type: '아랍어', example: 'ض', bytes: 2 },
    { type: '이모지', example: '😀', bytes: 4 }
  ]
}