"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Send, CheckSquare, Square, Eye, EyeOff, X, ArrowDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageBubble } from "./message-bubble"
import { DateSeparator } from "./date-separator"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ChatService, ChatAdminService, type ChatMessage } from "@/lib/chat-service"
import { useIsAdmin } from "@/lib/auth-utils"
import { getByteLength, MESSAGE_BYTE_LIMIT, getMessageLengthStatus, formatByteSize } from "@/lib/message-utils"
import { useInfiniteScroll } from "@/hooks/chat/use-infinite-scroll"
import { useChatCache } from "@/contexts/chat-cache-context"
import { needsDateSeparator, getDateSeparatorLabel } from "@/lib/chat-time-utils"

interface ChatRoomProps {
  roomType: "GLOBAL" | "INQUIRY"
  title: string
  description: string
  color: "purple" | "green" | "orange"
  isModalOpen?: boolean
  onMessageUpdate?: (messageId: number) => void
}

// ChatMessage 인터페이스는 ChatService에서 import

/**
 * 채팅방 컴포넌트
 * 카카오톡 스타일의 실시간 채팅 인터페이스
 */
const ChatRoom = memo(function ChatRoom({ roomType, title, description, color, isModalOpen = false, onMessageUpdate }: ChatRoomProps) {
  const { data: session } = useSession()
  const isAdmin = useIsAdmin()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  
  // 모바일 키보드 상태 관리
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 다중 선택 모드 관련 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set())
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false)
  
  // 메시지 바이트 길이 상태
  const messageByteLength = useMemo(() => getByteLength(newMessage), [newMessage])
  const messageLengthStatus = useMemo(() => getMessageLengthStatus(messageByteLength), [messageByteLength])
  
  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  // 채팅 캐시 훅
  const { getCachedMessages, setCachedMessages, addRealtimeMessage: addToCacheRealtimeMessage } = useChatCache()

  // 슬랙 스타일 무한 스크롤 설정
  const infiniteScrollConfig = {
    topLoadThreshold: 150,    // 서버 부하 고려해서 조금 더 가까이
    bottomLoadThreshold: 150,
    scrollDebounceMs: 16,     // 60fps 유지
    apiDebounceMs: 400,       // API 호출 간격 늘림 (서버 부하 감소)
    loadBatchSize: 15,        // 한번에 15개씩 로드 (네트워크 최적화)
    maxMessagesInMemory: 500, // 메모리 500개로 확장 (~272KB)
    virtualizeThreshold: 400  // 400개 초과시 가상화
  }

  // STOMP WebSocket 연결
  const { 
    isConnected, 
    isConnecting,
    onlineCount,
    sendMessage, 
    addMessageListener,
    addMessageUpdateListener,
    lastError 
  } = useWebSocket(roomType)

  /**
   * 이전 메시지 로드 함수 (슬랙 스타일)
   */
  const loadPreviousMessages = useCallback(async (lastMessageId?: number) => {
    try {
      const response = await ChatService.getChatHistory({
        roomType,
        lastMessageId,
        size: infiniteScrollConfig.loadBatchSize
      })
      
      return {
        messages: response.messages || [],
        hasMore: response.hasMore || false
      }
    } catch (error) {
      console.error('Failed to load previous messages:', error)
      toast({
        title: "메시지 로드 실패",
        description: "이전 메시지를 불러올 수 없습니다.",
        variant: "destructive"
      })
      return { messages: [], hasMore: false }
    }
  }, [roomType, infiniteScrollConfig.loadBatchSize, toast])

  /**
   * 무한 스크롤 훅 사용
   */
  const {
    scrollPosition,
    loadingState,
    scrollToBottom,
    scrollToPosition,
    newMessageBuffer,
    memoryLimitAlert,
    loadMore,
    virtualization
  } = useInfiniteScroll({
    containerRef: scrollContainerRef,
    messages,
    setMessages,
    onLoadPrevious: loadPreviousMessages,
    config: infiniteScrollConfig,
    getMessageId: (message) => message.messageId,
    enabled: isModalOpen
  })

  /**
   * 초기 메시지 로드 (캐시 활용)
   */
  const loadInitialMessages = useCallback(async () => {
    if (isInitialLoading) return
    
    setIsInitialLoading(true)
    
    try {
      // 채널 입장
      await ChatService.joinChatRoom(roomType)
      
      // 캐시된 메시지 확인
      const cachedMessages = getCachedMessages(roomType)
      
      if (cachedMessages && cachedMessages.length > 0) {
        console.log(`💾 캐시된 메시지 발견: ${cachedMessages.length}개`)
        
        // 캐시된 메시지의 마지막 ID 확인
        const lastCachedMessageId = Math.max(...cachedMessages.map(msg => msg.messageId))
        
        // 캐시 이후 새로운 메시지만 조회
        const response = await ChatService.getChatHistory({
          roomType,
          afterMessageId: lastCachedMessageId, // 이 ID 이후의 메시지만 조회
          size: infiniteScrollConfig.loadBatchSize
        })
        
        const newMessages = response.messages || []
        
        if (newMessages.length > 0) {
          console.log(`🆕 새로운 메시지 발견: ${newMessages.length}개`)
          // 캐시된 메시지 + 새로운 메시지 결합
          const combinedMessages = [...cachedMessages, ...newMessages]
          
          // 메모리 한계 체크하여 초과시 최신 메시지 우선 보존
          const finalMessages = combinedMessages.length > infiniteScrollConfig.maxMessagesInMemory
            ? combinedMessages.slice(-infiniteScrollConfig.maxMessagesInMemory)
            : combinedMessages
            
          setMessages(finalMessages)
          
          // 캐시 업데이트 (새로운 메시지들 추가)
          newMessages.forEach(msg => addToCacheRealtimeMessage(roomType, msg))
          
          console.log(`✅ 캐시+신규 메시지 로드 완료: ${finalMessages.length}개 (캐시: ${cachedMessages.length}, 신규: ${newMessages.length})`)
        } else {
          // 새로운 메시지가 없으면 캐시된 메시지만 사용
          // 캐시가 메모리 한계를 초과하는 경우 최신 메시지만 유지
          const finalMessages = cachedMessages.length > infiniteScrollConfig.maxMessagesInMemory
            ? cachedMessages.slice(-infiniteScrollConfig.maxMessagesInMemory)
            : cachedMessages
            
          setMessages(finalMessages)
          
          console.log(`✅ 캐시 메시지 로드 완료: ${finalMessages.length}개 (원본 캐시: ${cachedMessages.length}개)`)
        }
      } else {
        // 캐시가 없으면 기존 방식으로 초기 메시지 로드
        const response = await ChatService.getChatHistory({
          roomType,
          size: infiniteScrollConfig.loadBatchSize
        })
        
        const initialMessages = response.messages || []
        
        if (initialMessages.length === 0) {
          // 환영 메시지 생성
          const welcomeMessage: ChatMessage = {
            messageId: Date.now(),
            userSeq: 0,
            userName: "시스템",
            content: `${title}에 오신 것을 환영합니다! 첫 번째 메시지를 보내보세요.`,
            createdAt: new Date().toISOString(),
            messageType: "SYSTEM",
            roomType,
            isMyMessage: false,
            timeDisplay: "방금 전",
            deleted: false,
            serverAllianceId: 0
          }
          setMessages([welcomeMessage])
        } else {
          setMessages(initialMessages)
          // 초기 메시지들을 캐시에 저장
          setCachedMessages(roomType, initialMessages)
        }
      }
      
      // 하단으로 스크롤
      setTimeout(() => scrollToBottom(false), 100)
      
    } catch (error) {
      console.error('Failed to load initial messages:', error)
      toast({
        title: "메시지 로드 실패",
        description: "채팅 메시지를 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsInitialLoading(false)
    }
  }, [isInitialLoading, roomType, infiniteScrollConfig.loadBatchSize, title, scrollToBottom, toast, getCachedMessages, setCachedMessages, addToCacheRealtimeMessage])

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    if (isModalOpen && messages.length === 0) {
      loadInitialMessages()
    }
  }, [isModalOpen, messages.length, loadInitialMessages])

  // 모바일 키보드 감지 (Viewport height 변화 기반)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      // 모바일에서만 동작
      if (window.innerWidth <= 768) {
        const currentHeight = window.innerHeight
        const fullHeight = window.screen.height
        
        // 키보드가 나타났을 때 viewport height가 크게 줄어듦
        const keyboardVisible = currentHeight < fullHeight * 0.75
        
        if (keyboardVisible !== isKeyboardVisible) {
          setIsKeyboardVisible(keyboardVisible)
          
          // 키보드가 나타났을 때 메시지 영역을 아래로 스크롤
          if (keyboardVisible && scrollContainerRef.current) {
            setTimeout(() => scrollToBottom(false), 300)
          }
        }
      }
    }

    // 초기 상태 설정
    handleResize()
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Visualviewer API 지원 브라우저에서 더 정확한 키보드 감지
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!
      visualViewport.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
        visualViewport.removeEventListener('resize', handleResize)
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [isKeyboardVisible, scrollToBottom])

  // 모달이 닫힐 때 현재 메시지들을 캐시에 저장
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 또는 모달이 닫힐 때 캐시 저장
      if (messages.length > 0) {
        console.log(`💾 캐시 저장: ${messages.length}개 메시지`)
        setCachedMessages(roomType, messages)
      }
    }
  }, [isModalOpen, messages, roomType, setCachedMessages])

  /**
   * 실시간 메시지 수신 처리 (슬랙 스타일)
   */
  useEffect(() => {
    const removeListener = addMessageListener((newMessage: ChatMessage) => {
      // 현재 채팅방의 메시지만 처리
      if (newMessage.roomType === roomType) {
        // 실시간 메시지의 isMyMessage를 현재 사용자 기준으로 재계산
        const currentUserId = session?.user?.id
        const currentUserName = session?.user?.name
        const isMyMessage = currentUserId && (
          newMessage.userSeq === parseInt(currentUserId) ||
          newMessage.userName === currentUserName
        )
        
        const correctedMessage = {
          ...newMessage,
          isMyMessage: !!isMyMessage
        }
        
        // 무한 스크롤 API로 실시간 메시지 추가 (위치 기반 처리)
        const infiniteScrollAPI = (scrollContainerRef.current as any)?.__infiniteScrollAPI
        if (infiniteScrollAPI) {
          infiniteScrollAPI.addRealtimeMessage(correctedMessage)
        } else {
          // fallback: 기존 방식
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.messageId))
            if (existingIds.has(newMessage.messageId)) {
              return prev
            }
            return [...prev, correctedMessage]
          })
          
          // 사용자가 하단에 있으면 스크롤
          if (scrollPosition?.isNearBottom) {
            setTimeout(() => scrollToBottom(true), 50)
          }
        }
        
        // 실시간 메시지를 캐시에도 추가
        addToCacheRealtimeMessage(roomType, correctedMessage)
        
        // 플로팅 버튼에 최신 메시지 ID 알림
        if (onMessageUpdate && roomType === 'GLOBAL') {
          queueMicrotask(() => {
            onMessageUpdate(correctedMessage.messageId)
          })
        }
      }
    })

    return removeListener
  }, [roomType, addMessageListener, session, scrollPosition, scrollToBottom, onMessageUpdate])

  // 실시간 메시지 상태 업데이트 리스너 등록
  useEffect(() => {
    const removeListener = addMessageUpdateListener((update) => {
      console.log('📝 메시지 상태 업데이트:', update)
      
      setMessages(prev => prev.map(message => {
        if (message.messageId === update.messageId) {
          return {
            ...message,
            hiddenByAdmin: update.hiddenByAdmin,
            hiddenReason: update.hiddenReason,
            hiddenAt: update.hiddenAt
          }
        }
        return message
      }))
    })

    return removeListener
  }, [addMessageUpdateListener])

  // 기존 함수 제거됨 - 슬랙 스타일 loadInitialMessages로 대체

  // 기존 함수 제거됨 - 슬랙 스타일 무한 스크롤 훅으로 대체

  /**
   * 메시지 전송 (슬랙 스타일 - 간소화)
   */
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !session?.user) return
    
    const messageContent = newMessage.trim()
    
    // 바이트 길이 검증
    const contentByteLength = getByteLength(messageContent)
    if (contentByteLength > MESSAGE_BYTE_LIMIT) {
      toast({
        title: "메시지가 너무 깁니다",
        description: "메시지를 짧게 작성해 주세요.",
        variant: "destructive"
      })
      return
    }
    
    setNewMessage("")

    try {
      if (isConnected) {
        // WebSocket 전송 (실시간 리스너에서 처리)
        await sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
      } else {
        // REST API 전송 (직접 추가)
        const sentMessage = await ChatService.sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
        
        setMessages(prev => [...prev, sentMessage])
        scrollToBottom(true)
        
        // 전송한 메시지를 캐시에도 추가
        addToCacheRealtimeMessage(roomType, sentMessage)
        
        if (onMessageUpdate && roomType === 'GLOBAL') {
          onMessageUpdate(sentMessage.messageId)
        }
      }
    } catch (error) {
      console.error("메시지 전송 실패:", error)
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      setNewMessage(messageContent)
    }
  }, [newMessage, session, isConnected, roomType, sendMessage, scrollToBottom, onMessageUpdate, toast])

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 다중 선택 모드 관련 핸들러들
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedMessageIds(new Set())
  }

  const handleMessageSelection = (messageId: number, selected: boolean) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(messageId)
      } else {
        newSet.delete(messageId)
      }
      return newSet
    })
  }

  const selectAllMessages = () => {
    const textMessages = messages
      .filter(msg => msg.messageType === "TEXT" && !msg.hiddenByAdmin)
      .map(msg => msg.messageId)
    setSelectedMessageIds(new Set(textMessages))
  }

  const clearSelection = () => {
    setSelectedMessageIds(new Set())
  }

  const handleBulkHide = async () => {
    if (selectedMessageIds.size === 0) {
      toast({
        title: "선택된 메시지 없음",
        description: "가릴 메시지를 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    setIsBulkOperationLoading(true)
    try {
      const messageIds = Array.from(selectedMessageIds)
      const response = await ChatAdminService.hideMessages({
        messageIds,
        reason: "관리자에 의해 가려진 메시지입니다."
      })

      if (response.success) {
        toast({
          title: "메시지 가리기 완료",
          description: `${response.data?.processedCount || messageIds.length}개의 메시지가 가려졌습니다.`
        })
        setSelectedMessageIds(new Set())
        setIsSelectionMode(false)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('[ADMIN] 다중 메시지 가리기 오류:', error)
      toast({
        title: "메시지 가리기 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsBulkOperationLoading(false)
    }
  }

  const handleBulkUnhide = async () => {
    if (selectedMessageIds.size === 0) {
      toast({
        title: "선택된 메시지 없음",
        description: "복원할 메시지를 선택해주세요.",  
        variant: "destructive"
      })
      return
    }

    setIsBulkOperationLoading(true)
    try {
      const messageIds = Array.from(selectedMessageIds)
      const response = await ChatAdminService.unhideMessages({
        messageIds
      })

      if (response.success) {
        toast({
          title: "메시지 복원 완료",
          description: `${response.data?.processedCount || messageIds.length}개의 메시지가 복원되었습니다.`
        })
        setSelectedMessageIds(new Set())
        setIsSelectionMode(false)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('[ADMIN] 다중 메시지 복원 오류:', error)
      toast({
        title: "메시지 복원 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsBulkOperationLoading(false)
    }
  }

  // 기존 스크롤 핸들러 제거됨 - 슬랙 스타일 무한 스크롤 훅으로 대체

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 mobile-chat-container">
      {/* 채팅방 헤더 */}
      <div className={`p-2 xs:p-2.5 border-b bg-${color}-50 dark:bg-${color}-950 border-${color}-200 dark:border-${color}-800`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <h3 className={`font-medium text-sm xs:text-base truncate text-${color}-800 dark:text-${color}-200`}>
                {title}
              </h3>
              {/* 연결 상태 인디케이터 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs hidden xs:inline ${
                  isConnecting ? 'text-yellow-600' : 
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnecting ? '연결중' : 
                   isConnected ? '온라인' : 
                   lastError ? '오류' : '오프라인'}
                </span>
              </div>
            </div>
            <p className={`text-xs mt-0.5 truncate ${
              color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
              color === 'green' ? 'text-green-600 dark:text-green-400' :
              'text-orange-600 dark:text-orange-400'
            }`}>
              <span className="hidden xs:inline">{description}</span>
              <span className="xs:hidden">{description.split(' ')[0]}</span>
              {onlineCount > 0 && (
                <span className="hidden xs:inline"> • {onlineCount}명 접속중</span>
              )}
              {onlineCount > 0 && (
                <span className="xs:hidden"> • {onlineCount}명</span>
              )}
            </p>
          </div>
          
          {/* ADMIN 전용 선택 모드 버튼 */}
          {isAdmin && (
            <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                disabled={isBulkOperationLoading}
                className="h-6 xs:h-7 px-1.5 xs:px-2 text-xs"
              >
                {isSelectionMode ? <CheckSquare className="h-3 w-3 xs:mr-1" /> : <Square className="h-3 w-3 xs:mr-1" />}
                <span className="hidden xs:inline">{isSelectionMode ? "선택완료" : "선택모드"}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* ADMIN 선택 모드 컨트롤 바 */}
      {isAdmin && isSelectionMode && (
        <div className="p-1.5 xs:p-2 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-1 xs:gap-2 flex-1 min-w-0">
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {selectedMessageIds.size}개
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllMessages}
                disabled={isBulkOperationLoading}
                className="h-5 xs:h-6 px-1.5 xs:px-2 text-xs hidden xs:inline-flex"
              >
                전체선택
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isBulkOperationLoading || selectedMessageIds.size === 0}
                className="h-5 xs:h-6 px-1.5 xs:px-2 text-xs"
              >
                <span className="hidden xs:inline">선택해제</span>
                <span className="xs:hidden">해제</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
              <Button
                variant="destructive"
                size="sm"  
                onClick={handleBulkHide}
                disabled={isBulkOperationLoading || selectedMessageIds.size === 0}
                className="h-5 xs:h-6 px-1.5 xs:px-2 text-xs"
              >
                {isBulkOperationLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent xs:mr-1" />
                ) : (
                  <EyeOff className="h-3 w-3 xs:mr-1" />
                )}
                <span className="hidden xs:inline">가리기</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnhide}
                disabled={isBulkOperationLoading || selectedMessageIds.size === 0}
                className="h-5 xs:h-6 px-1.5 xs:px-2 text-xs"
              >
                {isBulkOperationLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent xs:mr-1" />
                ) : (
                  <Eye className="h-3 w-3 xs:mr-1" />
                )}
                <span className="hidden xs:inline">복원</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectionMode}
                disabled={isBulkOperationLoading}
                className="h-5 xs:h-6 px-1 xs:px-2 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 목록 - 슬랙 스타일 무한스크롤 */}
      <div 
        className="h-[320px] xs:h-[360px] sm:h-[390px] md:h-[440px] lg:h-[480px] p-2 xs:p-3 overflow-y-auto infinite-scroll-container scrollbar-thin chat-messages-area" 
        ref={scrollContainerRef}
      >
        {/* 상단 로딩 인디케이터 또는 한계 도달 메시지 */}
        {loadingState.isLoadingUp ? (
          <div className="flex items-center justify-center py-2 xs:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Loader2 className="h-3 w-3 xs:h-4 xs:w-4 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                <span className="hidden xs:inline">이전 메시지 로딩중...</span>
                <span className="xs:hidden">로딩중...</span>
              </span>
            </div>
          </div>
        ) : !loadingState.hasMoreUp && messages.length >= infiniteScrollConfig.maxMessagesInMemory ? (
          <div className="flex items-center justify-center py-2 xs:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full">
              <div className="h-3 w-3 xs:h-4 xs:w-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">📜</span>
              </div>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                <span className="hidden xs:inline">이전 대화를 모두 불러왔습니다 ✨</span>
                <span className="xs:hidden">모두 불러옴 ✨</span>
              </span>
            </div>
          </div>
        ) : null}

        {/* 초기 로딩 */}
        {isInitialLoading && (
          <div className="flex items-center justify-center py-6 xs:py-8">
            <div className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Loader2 className="h-4 w-4 xs:h-5 xs:w-5 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden xs:inline">채팅을 불러오는 중...</span>
                <span className="xs:hidden">로딩중...</span>
              </span>
            </div>
          </div>
        )}
        
        {/* 가상화된 메시지 렌더링 */}
        <div 
          className="space-y-2 transform-gpu relative" 
          style={{ height: virtualization.shouldVirtualize ? virtualization.totalHeight : 'auto' }}
        >
          {useMemo(() => {
            // 가상화 여부에 따른 렌더링 분기
            if (virtualization.shouldVirtualize) {
              return virtualization.virtualItems.map((virtualItem) => {
                const index = virtualItem.index
                const message = messages[index]
                
                if (!message) return null

                // 같은 사용자의 연속 메시지인지 확인
                const prevMessage = index > 0 ? messages[index - 1] : null
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
                
                const isFirstInGroup = !prevMessage || 
                  prevMessage.userSeq !== message.userSeq || 
                  prevMessage.messageType === "SYSTEM" ||
                  message.messageType === "SYSTEM"
                  
                const isLastInGroup = !nextMessage || 
                  nextMessage.userSeq !== message.userSeq || 
                  nextMessage.messageType === "SYSTEM" ||
                  message.messageType === "SYSTEM"
                
                // 날짜 구분선이 필요한지 확인
                const showDateSeparator = needsDateSeparator(prevMessage, message)
                
                return (
                  <div 
                    key={message.messageId} 
                    className="absolute w-full will-change-transform virtualized-item"
                    style={{
                      top: virtualItem.start,
                      height: virtualItem.end - virtualItem.start
                    }}
                  >
                    {/* 날짜 구분선 (가상화에서는 메시지와 함께 렌더링) */}
                    {showDateSeparator && (
                      <DateSeparator 
                        label={getDateSeparatorLabel(new Date(message.createdAt))}
                        className="mb-2"
                      />
                    )}
                    
                    <MessageBubble 
                      message={{...message, roomType}} 
                      isLastInGroup={isLastInGroup}
                      isFirstInGroup={isFirstInGroup}
                      isSelectable={isAdmin && isSelectionMode}
                      isSelected={selectedMessageIds.has(message.messageId)}
                      onSelectionChange={handleMessageSelection}
                    />
                  </div>
                )
              })
            } else {
              // 일반 렌더링 (가상화 임계점 미만)
              return messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
                
                const isFirstInGroup = !prevMessage || 
                  prevMessage.userSeq !== message.userSeq || 
                  prevMessage.messageType === "SYSTEM" ||
                  message.messageType === "SYSTEM"
                  
                const isLastInGroup = !nextMessage || 
                  nextMessage.userSeq !== message.userSeq || 
                  nextMessage.messageType === "SYSTEM" ||
                  message.messageType === "SYSTEM"
                
                // 날짜 구분선이 필요한지 확인
                const showDateSeparator = needsDateSeparator(prevMessage, message)
                
                return (
                  <React.Fragment key={message.messageId}>
                    {/* 날짜 구분선 */}
                    {showDateSeparator && (
                      <DateSeparator 
                        label={getDateSeparatorLabel(new Date(message.createdAt))}
                      />
                    )}
                    
                    {/* 메시지 버블 */}
                    <div className="will-change-transform message-bubble">
                      <MessageBubble 
                        message={{...message, roomType}} 
                        isLastInGroup={isLastInGroup}
                        isFirstInGroup={isFirstInGroup}
                        isSelectable={isAdmin && isSelectionMode}
                        isSelected={selectedMessageIds.has(message.messageId)}
                        onSelectionChange={handleMessageSelection}
                      />
                    </div>
                  </React.Fragment>
                )
              })
            }
          }, [messages, roomType, isAdmin, isSelectionMode, selectedMessageIds, handleMessageSelection, virtualization])}
        </div>
        
        {/* 슬랙 스타일 새 메시지 버퍼 알림 */}
        {newMessageBuffer.hasMessages && (
          <div className="sticky bottom-2 xs:bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              onClick={newMessageBuffer.flushAndScroll}
              variant="secondary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-in slide-in-from-bottom-2 duration-200 h-8 xs:h-9 px-2 xs:px-3 text-xs xs:text-sm"
            >
              <ArrowDown className="h-3 w-3 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
              <span className="hidden xs:inline">새 메시지 {newMessageBuffer.count}개</span>
              <span className="xs:hidden">{newMessageBuffer.count}개</span>
            </Button>
          </div>
        )}
        
        {/* 새 메시지 도착 알림 (간소화) */}
        {memoryLimitAlert.hasNewMessage && (
          <div className="sticky bottom-12 xs:bottom-16 left-1/2 transform -translate-x-1/2 z-20 px-2 xs:px-0">
            <div className="bg-green-500 hover:bg-green-600 text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-200 max-w-xs xs:max-w-sm">
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs xs:text-sm font-medium">
                    <span className="hidden xs:inline">💬 새 메시지가 도착했습니다</span>
                    <span className="xs:hidden">💬 새 메시지</span>
                  </p>
                  <p className="text-xs text-green-100 mt-0.5 xs:mt-1 truncate">
                    "{memoryLimitAlert.messagePreview}"
                  </p>
                </div>
                <div className="flex gap-1 xs:gap-2 flex-shrink-0">
                  <Button
                    onClick={memoryLimitAlert.goToLatest}
                    variant="secondary"
                    size="sm"
                    className="h-6 xs:h-7 px-2 xs:px-3 text-xs bg-white text-green-600 hover:bg-green-50"
                  >
                    보기
                  </Button>
                  <Button
                    onClick={memoryLimitAlert.dismiss}
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 xs:h-6 xs:w-6 p-0 text-green-200 hover:text-white hover:bg-green-600"
                  >
                    <X className="h-3 w-3 xs:h-4 xs:w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 하단 로딩 인디케이터 */}
        {loadingState.isLoadingDown && (
          <div className="flex items-center justify-center py-2 xs:py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Loader2 className="h-3 w-3 xs:h-4 xs:w-4 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                <span className="hidden xs:inline">새 메시지 로딩중...</span>
                <span className="xs:hidden">로딩중...</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 메시지 입력창 */}
      <div className="p-2 xs:p-3 border-t bg-white dark:bg-gray-800 chat-input-area">
        {/* 문자 수 카운터 (길이 제한 근처일 때만 표시) */}
        {newMessage && messageLengthStatus.percentage > 70 && (
          <div className="mb-1.5 xs:mb-2 flex justify-end">
            <div className={`text-xs ${messageLengthStatus.color}`}>
              {newMessage.length}자
              {messageLengthStatus.isOverLimit && (
                <span className="ml-1 xs:ml-2 text-red-500 font-semibold">
                  <span className="hidden xs:inline">너무 긴 메시지입니다</span>
                  <span className="xs:hidden">길이 초과</span>
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 xs:gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              session?.user 
                ? window.innerWidth < 480 
                  ? "메시지 입력..." 
                  : `${title}에 메시지를 입력하세요...`
                : "로그인이 필요합니다"
            }
            className={`flex-1 h-9 xs:h-10 text-base mobile-input ${
              messageLengthStatus.isOverLimit ? 'border-red-500 focus:border-red-500' : ''
            }`}
            disabled={!session?.user}
            style={{
              fontSize: '16px', // iOS Safari 줌인 방지
              WebkitAppearance: 'none', // iOS 기본 스타일 제거
              borderRadius: '0.375rem' // Tailwind rounded 클래스와 동일
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !session?.user || messageLengthStatus.isOverLimit}
            size="sm"
            className={`h-9 xs:h-10 px-2.5 xs:px-4 flex-shrink-0 ${
              color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
              color === 'green' ? 'bg-green-600 hover:bg-green-700' :
              'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

// displayName 설정 (React DevTools용)
ChatRoom.displayName = 'ChatRoom'

export { ChatRoom }