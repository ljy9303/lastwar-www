/**
 * 슬랙 스타일 경량화된 무한 스크롤 유틸리티
 * 최소 스펙 서버에서도 원활하게 작동하도록 최적화
 */

export interface ScrollPosition {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  isAtTop: boolean
  isAtBottom: boolean
  isNearTop: boolean
  isNearBottom: boolean
  percentage: number
}

export interface ScrollThresholds {
  topThreshold: number
  bottomThreshold: number
  nearTopThreshold: number
  nearBottomThreshold: number
}

export interface InfiniteScrollConfig {
  /** 상단 로딩 트리거 임계점 (px) */
  topLoadThreshold: number
  /** 하단 로딩 트리거 임계점 (px) */
  bottomLoadThreshold: number
  /** 스크롤 이벤트 디바운스 시간 (ms) */
  scrollDebounceMs: number
  /** API 호출 디바운스 시간 (ms) */
  apiDebounceMs: number
  /** 한번에 로드할 메시지 수 */
  loadBatchSize: number
  /** 메모리에 유지할 최대 메시지 수 */
  maxMessagesInMemory: number
  /** 뷰포트 밖에서 제거할 메시지 수 */
  virtualizeThreshold: number
}

export const DEFAULT_SCROLL_CONFIG: InfiniteScrollConfig = {
  topLoadThreshold: 200,
  bottomLoadThreshold: 200, 
  scrollDebounceMs: 16, // 60fps
  apiDebounceMs: 300,
  loadBatchSize: 20, // 서버 부하 고려해서 20개씩
  maxMessagesInMemory: 500, // 500개로 확장 (~272KB)
  virtualizeThreshold: 400 // 400개 초과시 가상화
}

/**
 * 스크롤 위치 정보를 계산하는 함수
 */
export const getScrollPosition = (container: HTMLElement): ScrollPosition => {
  const { scrollTop, scrollHeight, clientHeight } = container
  const distanceFromTop = scrollTop
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    isAtTop: distanceFromTop <= 5,
    isAtBottom: distanceFromBottom <= 5,
    isNearTop: distanceFromTop <= 100,
    isNearBottom: distanceFromBottom <= 100,
    percentage: scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0
  }
}

/**
 * 디바운스 함수 (메모리 효율적)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * 쓰로틀 함수 (성능 최적화)
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 스크롤 위치 보존 헬퍼 (상단 메시지 추가 시)
 */
export const preserveScrollPosition = (
  container: HTMLElement,
  callback: () => void
): void => {
  const savedScrollHeight = container.scrollHeight
  const savedScrollTop = container.scrollTop
  
  // DOM 업데이트 실행
  callback()
  
  // 스크롤 위치 복원 (다음 프레임에서)
  requestAnimationFrame(() => {
    const heightDifference = container.scrollHeight - savedScrollHeight
    container.scrollTop = savedScrollTop + heightDifference
  })
}

/**
 * 부드러운 스크롤 유틸리티
 */
export const smoothScrollTo = (
  container: HTMLElement,
  targetPosition: number,
  duration: number = 300
): void => {
  const startPosition = container.scrollTop
  const distance = targetPosition - startPosition
  let startTime: number | null = null
  
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }
  
  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    
    container.scrollTop = startPosition + distance * easeInOutCubic(progress)
    
    if (progress < 1) {
      requestAnimationFrame(animation)
    }
  }
  
  requestAnimationFrame(animation)
}

/**
 * 메시지 배열 메모리 최적화
 */
export interface OptimizeMessagesOptions {
  messages: any[]
  maxMessages: number
  currentScrollPosition: ScrollPosition
  keepFromTop: number
  keepFromBottom: number
}

export const optimizeMessageArray = <T extends { id: any }>({
  messages,
  maxMessages,
  currentScrollPosition,
  keepFromTop = 50,
  keepFromBottom = 50
}: OptimizeMessagesOptions): T[] => {
  if (messages.length <= maxMessages) {
    return messages as T[]
  }
  
  // 최신 메시지는 항상 보존해야 하는 개수 (최소 50개, 최대 전체의 20%)
  const alwaysKeepLatest = Math.min(50, Math.floor(maxMessages * 0.2))
  const availableForOlder = maxMessages - alwaysKeepLatest
  
  // 사용자가 하단에 있으면 최신 메시지 우선 보존
  if (currentScrollPosition.isNearBottom) {
    return messages.slice(-maxMessages) as T[]
  }
  
  // 사용자가 상단에 있더라도 최신 메시지는 보존
  if (currentScrollPosition.isNearTop) {
    // 오래된 메시지 + 항상 보존할 최신 메시지
    const oldMessages = messages.slice(0, availableForOlder)
    const latestMessages = messages.slice(-alwaysKeepLatest)
    return [...oldMessages, ...latestMessages] as T[]
  }
  
  // 중간에 있으면 현재 위치 기준으로 양쪽 보존 + 최신 메시지 보존
  const middleIndex = Math.floor(messages.length * currentScrollPosition.percentage / 100)
  const adjustedKeepFromTop = Math.min(keepFromTop, availableForOlder - keepFromBottom)
  const start = Math.max(0, middleIndex - adjustedKeepFromTop)
  const end = Math.min(messages.length - alwaysKeepLatest, middleIndex + keepFromBottom)
  
  const middleMessages = messages.slice(start, end)
  const latestMessages = messages.slice(-alwaysKeepLatest)
  
  return [...middleMessages, ...latestMessages] as T[]
}

/**
 * IntersectionObserver 기반 무한 스크롤 트리거
 */
export const createInfiniteScrollObserver = (
  onLoadMore: (direction: 'up' | 'down') => void,
  options: { topMargin?: string; bottomMargin?: string } = {}
): {
  observeTop: (element: Element) => void
  observeBottom: (element: Element) => void
  disconnect: () => void
} => {
  const { topMargin = '100px', bottomMargin = '100px' } = options
  
  const topObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onLoadMore('up')
        }
      })
    },
    { rootMargin: `${topMargin} 0px 0px 0px` }
  )
  
  const bottomObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          onLoadMore('down')
        }
      })
    },
    { rootMargin: `0px 0px ${bottomMargin} 0px` }
  )
  
  return {
    observeTop: (element: Element) => topObserver.observe(element),
    observeBottom: (element: Element) => bottomObserver.observe(element),
    disconnect: () => {
      topObserver.disconnect()
      bottomObserver.disconnect()
    }
  }
}

/**
 * 메시지 로딩 상태 관리
 */
export interface LoadingState {
  isLoadingUp: boolean
  isLoadingDown: boolean
  hasMoreUp: boolean
  hasMoreDown: boolean
  lastLoadedUp?: number
  lastLoadedDown?: number
}

export const createLoadingStateManager = (initialState: Partial<LoadingState> = {}) => {
  let state: LoadingState = {
    isLoadingUp: false,
    isLoadingDown: false,
    hasMoreUp: true,
    hasMoreDown: true,
    ...initialState
  }
  
  const setState = (updates: Partial<LoadingState>) => {
    state = { ...state, ...updates }
  }
  
  const getState = () => ({ ...state })
  
  const canLoadMore = (direction: 'up' | 'down'): boolean => {
    if (direction === 'up') {
      return state.hasMoreUp && !state.isLoadingUp
    }
    return state.hasMoreDown && !state.isLoadingDown
  }
  
  const startLoading = (direction: 'up' | 'down') => {
    setState({
      [direction === 'up' ? 'isLoadingUp' : 'isLoadingDown']: true
    })
  }
  
  const stopLoading = (direction: 'up' | 'down', hasMore: boolean = true) => {
    setState({
      [direction === 'up' ? 'isLoadingUp' : 'isLoadingDown']: false,
      [direction === 'up' ? 'hasMoreUp' : 'hasMoreDown']: hasMore,
      [direction === 'up' ? 'lastLoadedUp' : 'lastLoadedDown']: Date.now()
    })
  }
  
  return {
    getState,
    setState,
    canLoadMore,
    startLoading,
    stopLoading
  }
}

/**
 * 실시간 메시지 버퍼 관리 (사용자가 스크롤 위에 있을 때)
 */
export interface MessageBuffer<T> {
  messages: T[]
  count: number
  clear: () => void
  add: (message: T) => void
  flush: () => T[]
}

export const createMessageBuffer = <T>(): MessageBuffer<T> => {
  let buffer: T[] = []
  
  return {
    get messages() { return [...buffer] },
    get count() { return buffer.length },
    clear: () => { buffer = [] },
    add: (message: T) => { buffer.push(message) },
    flush: () => {
      const messages = [...buffer]
      buffer = []
      return messages
    }
  }
}