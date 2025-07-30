/**
 * 슬랙 스타일 무한 스크롤 훅
 * 채팅방에서 사용하기 위한 경량화된 무한 스크롤 구현
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { 
  getScrollPosition, 
  preserveScrollPosition, 
  smoothScrollTo,
  debounce,
  throttle,
  createLoadingStateManager,
  createMessageBuffer,
  optimizeMessageArray,
  DEFAULT_SCROLL_CONFIG,
  type InfiniteScrollConfig,
  type ScrollPosition,
  type LoadingState
} from '@/lib/infinite-scroll-utils'

interface UseInfiniteScrollProps<T> {
  /** 스크롤 컨테이너 ref */
  containerRef: React.RefObject<HTMLElement>
  /** 현재 메시지 배열 */
  messages: T[]
  /** 메시지 업데이트 함수 */
  setMessages: React.Dispatch<React.SetStateAction<T[]>>
  /** 이전 메시지 로드 함수 */
  onLoadPrevious: (lastMessageId?: any) => Promise<{ messages: T[], hasMore: boolean }>
  /** 다음 메시지 로드 함수 */
  onLoadNext?: (firstMessageId?: any) => Promise<{ messages: T[], hasMore: boolean }>
  /** 설정 옵션 */
  config?: Partial<InfiniteScrollConfig>
  /** 메시지 ID 추출 함수 */
  getMessageId: (message: T) => any
  /** 활성화 여부 */
  enabled?: boolean
}

interface UseInfiniteScrollReturn {
  /** 현재 스크롤 위치 정보 */
  scrollPosition: ScrollPosition | null
  /** 로딩 상태 */
  loadingState: LoadingState
  /** 하단으로 스크롤 */
  scrollToBottom: (smooth?: boolean) => void
  /** 특정 위치로 스크롤 */
  scrollToPosition: (position: number, smooth?: boolean) => void
  /** 실시간 메시지 버퍼 */
  newMessageBuffer: {
    count: number
    hasMessages: boolean
    flushAndScroll: () => void
    clear: () => void
  }
  /** 메모리 한계 시 새 메시지 알림 */
  memoryLimitAlert: {
    hasNewMessage: boolean
    messagePreview: string
    goToLatest: () => void
    dismiss: () => void
  }
  /** 수동 로드 함수들 */
  loadMore: {
    up: () => Promise<void>
    down: () => Promise<void>
  }
  /** 가상화 정보 */
  virtualization: {
    shouldVirtualize: boolean
    virtualItems: Array<{ index: number; start: number; end: number }>
    totalHeight: number
    getVisibleRange: () => { start: number; end: number }
  }
}

export function useInfiniteScroll<T extends Record<string, any>>({
  containerRef,
  messages,
  setMessages,
  onLoadPrevious,
  onLoadNext,
  config = {},
  getMessageId,
  enabled = true
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn {
  const finalConfig = { ...DEFAULT_SCROLL_CONFIG, ...config }
  
  // 상태 관리
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition | null>(null)
  const loadingStateManager = useRef(createLoadingStateManager())
  const messageBuffer = useRef(createMessageBuffer<T>())
  const [, forceUpdate] = useState({}) // 강제 리렌더링용
  
  // 메모리 한계 알림 상태
  const [memoryLimitNewMessage, setMemoryLimitNewMessage] = useState<{
    hasMessage: boolean
    preview: string
  }>({ hasMessage: false, preview: '' })
  
  // 내부 상태 ref들
  const lastScrollTop = useRef(0)
  const isUserScrolling = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 가상화 설정 - 모바일 반응형
  const getContainerHeight = () => {
    if (typeof window === 'undefined') return 440
    if (window.innerWidth < 480) return 320 // 모바일
    if (window.innerWidth < 640) return 360 // xs
    if (window.innerWidth < 768) return 390 // sm
    if (window.innerWidth < 1024) return 440 // md
    return 480 // lg+
  }

  const virtualScrollOptions = {
    itemHeight: typeof window !== 'undefined' && window.innerWidth < 480 ? 65 : 80, // 모바일에서 메시지 높이 감소
    containerHeight: getContainerHeight(),
    overscan: typeof window !== 'undefined' && window.innerWidth < 480 ? 3 : 5, // 모바일에서 오버스캔 감소
    threshold: finalConfig.virtualizeThreshold
  }
  
  // 가상 스크롤 미사용으로 기본값 설정
  const virtualScroll = {
    visibleItems: messages,
    startIndex: 0,
    endIndex: messages.length,
    totalHeight: 0,
    offsetY: 0
  }
  
  /**
   * 현재 스크롤 위치 업데이트
   */
  const updateScrollPosition = useCallback(() => {
    if (!containerRef.current) return
    
    const position = getScrollPosition(containerRef.current)
    setScrollPosition(position)
    return position
  }, [containerRef])
  
  /**
   * 하단으로 스크롤
   */
  const scrollToBottom = useCallback((smooth = true) => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const targetPosition = container.scrollHeight - container.clientHeight
    
    if (smooth) {
      smoothScrollTo(container, targetPosition, 300)
    } else {
      container.scrollTop = targetPosition
    }
  }, [containerRef])
  
  /**
   * 특정 위치로 스크롤
   */
  const scrollToPosition = useCallback((position: number, smooth = true) => {
    if (!containerRef.current) return
    
    if (smooth) {
      smoothScrollTo(containerRef.current, position, 300)
    } else {
      containerRef.current.scrollTop = position
    }
  }, [containerRef])
  
  /**
   * 이전 메시지 로드 (상단 방향)
   */
  const loadPreviousMessages = useCallback(async () => {
    if (!enabled || !containerRef.current) return
    
    const state = loadingStateManager.current.getState()
    if (!loadingStateManager.current.canLoadMore('up')) return
    
    // 메시지 한계 체크: maxMessagesInMemory에 도달했으면 더 이상 로드하지 않음
    if (messages.length >= finalConfig.maxMessagesInMemory) {
      console.log(`✅ 이전 대화 로딩 완료: ${messages.length}개 메시지 (최대 조회량 도달)`)
      loadingStateManager.current.stopLoading('up', false) // hasMore = false로 설정
      return
    }
    
    loadingStateManager.current.startLoading('up')
    
    try {
      const oldestMessage = messages[0]
      const lastMessageId = oldestMessage ? getMessageId(oldestMessage) : undefined
      
      const result = await onLoadPrevious(lastMessageId)
      
      if (result.messages.length > 0) {
        preserveScrollPosition(containerRef.current, () => {
          setMessages(prev => {
            // 중복 제거
            const existingIds = new Set(prev.map(getMessageId))
            const newMessages = result.messages.filter(msg => !existingIds.has(getMessageId(msg)))
            
            const combined = [...newMessages, ...prev]
            
            // 메모리 한계 체크
            if (combined.length >= finalConfig.maxMessagesInMemory) {
              // 한계에 도달하면 더 이상 로드 불가 표시
              loadingStateManager.current.stopLoading('up', false)
              return combined.slice(0, finalConfig.maxMessagesInMemory)
            }
            
            return combined
          })
        })
      }
      
      // 서버에서 더 이상 메시지가 없거나, 메모리 한계에 도달했는지 체크
      const hasMoreAndUnderLimit = result.hasMore && (messages.length < finalConfig.maxMessagesInMemory)
      loadingStateManager.current.stopLoading('up', hasMoreAndUnderLimit)
    } catch (error) {
      console.error('Failed to load previous messages:', error)
      loadingStateManager.current.stopLoading('up', true)
    }
  }, [enabled, containerRef, messages, onLoadPrevious, getMessageId, setMessages, finalConfig, updateScrollPosition])
  
  /**
   * 다음 메시지 로드 (하단 방향)
   */
  const loadNextMessages = useCallback(async () => {
    if (!enabled || !containerRef.current || !onLoadNext) return
    
    if (!loadingStateManager.current.canLoadMore('down')) return
    
    loadingStateManager.current.startLoading('down')
    
    try {
      const newestMessage = messages[messages.length - 1]
      const firstMessageId = newestMessage ? getMessageId(newestMessage) : undefined
      
      const result = await onLoadNext(firstMessageId)
      
      if (result.messages.length > 0) {
        setMessages(prev => {
          // 중복 제거
          const existingIds = new Set(prev.map(getMessageId))
          const newMessages = result.messages.filter(msg => !existingIds.has(getMessageId(msg)))
          
          const combined = [...prev, ...newMessages]
          
          // 메모리 최적화
          const currentPosition = updateScrollPosition()
          if (currentPosition && combined.length > finalConfig.maxMessagesInMemory) {
            return optimizeMessageArray({
              messages: combined,
              maxMessages: finalConfig.maxMessagesInMemory,
              currentScrollPosition: currentPosition,
              keepFromTop: finalConfig.loadBatchSize,
              keepFromBottom: finalConfig.loadBatchSize
            })
          }
          
          return combined
        })
      }
      
      loadingStateManager.current.stopLoading('down', result.hasMore)
    } catch (error) {
      console.error('Failed to load next messages:', error)
      loadingStateManager.current.stopLoading('down', true)
    }
  }, [enabled, containerRef, messages, onLoadNext, getMessageId, setMessages, finalConfig, updateScrollPosition])
  
  /**
   * 스크롤 이벤트 핸들러
   */
  const handleScroll = useCallback(
    throttle(() => {
      if (!enabled || !containerRef.current) return
      
      const position = updateScrollPosition()
      if (!position) return
      
      // 사용자 스크롤 감지
      const currentScrollTop = position.scrollTop
      if (Math.abs(currentScrollTop - lastScrollTop.current) > 5) {
        isUserScrolling.current = true
        
        // 스크롤 정지 감지
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = setTimeout(() => {
          isUserScrolling.current = false
        }, 150)
      }
      lastScrollTop.current = currentScrollTop
      
      // 무한 스크롤 트리거 체크
      const state = loadingStateManager.current.getState()
      
      // 상단 로딩 체크 (메시지 한계 미도달 시에만)
      if (position.scrollTop < finalConfig.topLoadThreshold && 
          state.hasMoreUp && 
          !state.isLoadingUp && 
          messages.length < finalConfig.maxMessagesInMemory) {
        loadPreviousMessages()
      }
      
      // 하단 로딩 체크 (onLoadNext가 있을 때만)
      if (onLoadNext && position.scrollHeight - position.scrollTop - position.clientHeight < finalConfig.bottomLoadThreshold && state.hasMoreDown && !state.isLoadingDown) {
        loadNextMessages()
      }
    }, finalConfig.scrollDebounceMs),
    [enabled, containerRef, finalConfig, updateScrollPosition, loadPreviousMessages, loadNextMessages, onLoadNext]
  )
  
  /**
   * 실시간 메시지 버퍼 관리
   */
  const newMessageBufferAPI = {
    get count() { return messageBuffer.current.count },
    get hasMessages() { return messageBuffer.current.count > 0 },
    flushAndScroll: () => {
      // 실제 메시지는 이미 추가되었으므로 버퍼만 비우고 스크롤
      messageBuffer.current.clear()
      forceUpdate({})
      // 하단으로 스크롤
      setTimeout(() => scrollToBottom(), 100)
    },
    clear: () => {
      messageBuffer.current.clear()
      forceUpdate({})
    }
  }
  
  /**
   * 실시간 메시지 추가 (외부에서 호출)
   */
  const addRealtimeMessage = useCallback((message: T) => {
    const position = updateScrollPosition()
    const isAtMemoryLimit = messages.length >= finalConfig.maxMessagesInMemory
    
    // 실시간 메시지는 항상 메시지 배열에 추가 (최신 메시지 보존을 위해)
    setMessages(prev => {
      const updated = [...prev, message]
      
      // 메모리 최적화 적용 (최신 메시지는 항상 보존됨)
      if (updated.length > finalConfig.maxMessagesInMemory && position) {
        return optimizeMessageArray({
          messages: updated,
          maxMessages: finalConfig.maxMessagesInMemory,
          currentScrollPosition: position,
          keepFromTop: finalConfig.loadBatchSize,
          keepFromBottom: finalConfig.loadBatchSize
        })
      }
      
      return updated
    })
    
    if (position?.isNearBottom || !isUserScrolling.current) {
      // 하단에 있거나 사용자가 스크롤하지 않으면 자동 스크롤
      queueMicrotask(() => scrollToBottom())
    } else {
      // 중간/상단에 있으면서 메모리 한계에 도달한 경우
      if (isAtMemoryLimit && position?.isNearTop) {
        // 메모리 한계 알림 표시
        const messageContent = (message as any).content || '새 메시지'
        const preview = messageContent.length > 30 
          ? messageContent.substring(0, 30) + '...' 
          : messageContent
        
        setMemoryLimitNewMessage({
          hasMessage: true,
          preview: preview
        })
      } else {
        // 일반적인 버퍼링 처리
        messageBuffer.current.add(message)
        forceUpdate({})
      }
    }
  }, [updateScrollPosition, setMessages, scrollToBottom, finalConfig, messages.length])
  
  /**
   * 스크롤 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    
    const container = containerRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [enabled, containerRef, handleScroll])
  
  /**
   * 초기 스크롤 위치 설정 및 무한스크롤 상태 초기화
   */
  useEffect(() => {
    if (messages.length > 0) {
      updateScrollPosition()
      
      // 메시지가 최대 조회량에 도달한 경우 무한스크롤 상태 업데이트
      if (messages.length >= finalConfig.maxMessagesInMemory) {
        console.log(`📜 대화 히스토리 로딩 완료: ${messages.length}개 메시지`)
        loadingStateManager.current.stopLoading('up', false) // hasMore = false
      } else {
        // 더 많은 메시지 로딩 가능
        loadingStateManager.current.setState({ hasMoreUp: true })
      }
    }
  }, [messages.length, updateScrollPosition, finalConfig.maxMessagesInMemory])
  
  // 외부에서 사용할 수 있도록 addRealtimeMessage를 ref에 저장
  const apiRef = useRef({ addRealtimeMessage })
  apiRef.current.addRealtimeMessage = addRealtimeMessage
  
  // 전역에서 접근 가능하도록 (필요시)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__infiniteScrollAPI = apiRef.current
    }
  }, [containerRef])
  
  /**
   * 메모리 한계 알림 API
   */
  const memoryLimitAlertAPI = {
    hasNewMessage: memoryLimitNewMessage.hasMessage,
    messagePreview: memoryLimitNewMessage.preview,
    goToLatest: () => {
      // 최신 메시지로 이동하고 알림 해제
      scrollToBottom(true)
      setMemoryLimitNewMessage({ hasMessage: false, preview: '' })
    },
    dismiss: () => {
      // 알림만 해제
      setMemoryLimitNewMessage({ hasMessage: false, preview: '' })
    }
  }

  return {
    scrollPosition,
    loadingState: loadingStateManager.current.getState(),
    scrollToBottom,
    scrollToPosition,
    newMessageBuffer: newMessageBufferAPI,
    memoryLimitAlert: memoryLimitAlertAPI,
    loadMore: {
      up: loadPreviousMessages,
      down: loadNextMessages
    },
    virtualization: {
      shouldVirtualize: virtualScroll.shouldVirtualize,
      virtualItems: virtualScroll.virtualItems,
      totalHeight: virtualScroll.totalHeight,
      getVisibleRange: virtualScroll.getVisibleRange
    }
  }
}