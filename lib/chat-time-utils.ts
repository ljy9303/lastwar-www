/**
 * 채팅 시간 표시 유틸리티
 * 카카오톡/슬랙 스타일의 시간 표시 기능
 */

/**
 * 시간을 카카오톡 스타일로 포맷팅
 * 오늘: 오전/오후 HH:MM
 * 다른 날: 날짜와 함께 표시
 */
export function formatChatTime(dateString: string): string {
  try {
    const messageDate = new Date(dateString)
    const now = new Date()
    
    // 같은 날인지 확인
    const isSameDay = 
      messageDate.getFullYear() === now.getFullYear() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getDate() === now.getDate()
    
    if (isSameDay) {
      // 오늘인 경우: 오전/오후 시:분
      return formatTimeWithAmPm(messageDate)
    } else {
      // 다른 날인 경우: 월/일 오전/오후 시:분
      const month = messageDate.getMonth() + 1
      const day = messageDate.getDate()
      const timeStr = formatTimeWithAmPm(messageDate)
      return `${month}/${day} ${timeStr}`
    }
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error)
    return '시간 오류'
  }
}

/**
 * 시간을 오전/오후 형식으로 포맷팅
 */
function formatTimeWithAmPm(date: Date): string {
  const hours24 = date.getHours()
  const minutes = date.getMinutes()
  
  let period: string
  let hours12: number
  
  if (hours24 === 0) {
    period = '오전'
    hours12 = 12
  } else if (hours24 < 12) {
    period = '오전'
    hours12 = hours24
  } else if (hours24 === 12) {
    period = '오후'
    hours12 = 12
  } else {
    period = '오후'
    hours12 = hours24 - 12
  }
  
  const minutesStr = minutes.toString().padStart(2, '0')
  return `${period} ${hours12}:${minutesStr}`
}

/**
 * 날짜 구분선을 위한 날짜 정보
 */
export interface DateSeparatorInfo {
  date: Date
  label: string
  key: string
}

/**
 * 날짜 구분선 라벨 생성
 * 오늘, 어제, 또는 "월일 요일" 형식
 */
export function getDateSeparatorLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return '오늘'
  } else if (diffInDays === 1) {
    return '어제'
  } else if (diffInDays < 7) {
    // 1주일 이내는 요일로 표시
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return weekdays[date.getDay()]
  } else {
    // 1주일 이상은 "월일 요일" 형식
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 ${weekday}`
  }
}

/**
 * 메시지 목록에서 날짜 구분선이 필요한 위치 계산
 */
export function calculateDateSeparators(messages: Array<{ createdAt: string }>): DateSeparatorInfo[] {
  const separators: DateSeparatorInfo[] = []
  const seenDates = new Set<string>()
  
  messages.forEach((message, index) => {
    try {
      const messageDate = new Date(message.createdAt)
      const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`
      
      // 이미 처리한 날짜가 아니라면 구분선 추가
      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey)
        separators.push({
          date: messageDate,
          label: getDateSeparatorLabel(messageDate),
          key: `date-${dateKey}-${index}`
        })
      }
    } catch (error) {
      console.error('날짜 구분선 계산 오류:', error)
    }
  })
  
  return separators
}

/**
 * 두 메시지 사이에 날짜 구분선이 필요한지 확인
 */
export function needsDateSeparator(prevMessage: { createdAt: string } | null, currentMessage: { createdAt: string }): boolean {
  if (!prevMessage) return true // 첫 번째 메시지는 항상 구분선 필요
  
  try {
    const prevDate = new Date(prevMessage.createdAt)
    const currentDate = new Date(currentMessage.createdAt)
    
    // 날짜가 다르면 구분선 필요
    return prevDate.getDate() !== currentDate.getDate() ||
           prevDate.getMonth() !== currentDate.getMonth() ||
           prevDate.getFullYear() !== currentDate.getFullYear()
  } catch (error) {
    console.error('날짜 구분선 필요성 확인 오류:', error)
    return false
  }
}