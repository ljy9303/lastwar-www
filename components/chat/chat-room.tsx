"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// ScrollArea 제거하고 기본 div 사용으로 자동 스크롤 문제 해결
import { MessageBubble } from "./message-bubble"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ChatService, type ChatMessage } from "@/lib/chat-service"

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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [lastModalOpenState, setLastModalOpenState] = useState(false)
  const [allowInfiniteScroll, setAllowInfiniteScroll] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // STOMP WebSocket 연결
  const { 
    isConnected, 
    isConnecting,
    onlineCount,
    sendMessage, 
    addMessageListener,
    lastError 
  } = useWebSocket(roomType)

  // 메시지 목록의 끝으로 스크롤 (강화된 로직)
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollAreaRef.current) return
    
    const scrollElement = scrollAreaRef.current
    
    if (force) {
      // 강제 스크롤 시 여러 방법으로 확실하게 맨 아래로
      const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight
      
      // 방법 1: 직접 설정
      scrollElement.scrollTop = targetScrollTop
      
      // 방법 2: scrollTo 사용 (즉시)
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'auto'
      })
      
      // 방법 3: requestAnimationFrame으로 한번 더 확인
      requestAnimationFrame(() => {
        if (scrollElement.scrollTop < targetScrollTop - 10) {
          scrollElement.scrollTop = targetScrollTop
        }
      })
      
    } else {
      // 일반 스크롤 시 사용자가 맨 아래 근처에 있는지 확인
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom) {
        scrollElement.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [])

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    loadInitialMessages()
  }, [roomType])

  // 모달이 닫혔다가 다시 열릴 때만 최신 메시지 새로고침
  useEffect(() => {
    // 모달이 닫혔다가 다시 열렸을 때만 새로고침
    if (isModalOpen && !lastModalOpenState && roomType) {
      loadInitialMessages()
    }
    setLastModalOpenState(isModalOpen)
  }, [isModalOpen, roomType])

  // 새 메시지가 추가될 때 스크롤 (수정된 로직)
  useEffect(() => {
    if (messages.length > 0) {
      // DOM 업데이트를 기다린 후 스크롤
      const timeoutId = setTimeout(() => {
        scrollToBottom(false) // 조건부 스크롤
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, scrollToBottom])

  // 실시간 메시지 수신 리스너 등록 (최적화)
  useEffect(() => {
    const removeListener = addMessageListener((newMessage: ChatMessage) => {
      // 현재 채팅방의 메시지만 처리
      if (newMessage.roomType === roomType) {
        setMessages(prev => {
          // 중복 메시지 방지 (성능 최적화)
          if (prev.some(msg => msg.messageId === newMessage.messageId)) {
            return prev
          }
          
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
          
          // 플로팅 버튼에 최신 메시지 ID 알림 (안전한 방식)
          if (onMessageUpdate && roomType === 'GLOBAL') {
            // 렌더링 중 상태 업데이트 방지
            setTimeout(() => {
              onMessageUpdate(correctedMessage.messageId)
            }, 0)
          }
          
          // 무한스크롤을 위해 메시지 제한 제거 (모든 메시지 유지)
          return [...prev, correctedMessage]
        })
      }
    })

    // cleanup 함수에서 리스너만 정리
    return removeListener
  }, [roomType, addMessageListener]) // session.user 의존성 제거하여 리렌더링 최적화

  // 초기 메시지 로드
  const loadInitialMessages = async () => {
    setIsLoading(true)
    setAllowInfiniteScroll(false) // 초기 로딩 중에는 무한스크롤 비활성화
    allowInfiniteScrollRef.current = false // ref도 함께 비활성화
    try {
      // 채팅방 입장 처리
      await ChatService.joinChatRoom(roomType)
      
      // 최신 메시지 10개 로드 (초기 성능 최적화)
      const response = await ChatService.getChatHistory({
        roomType,
        size: 10
      })
      
      // 응답 검증
      if (!response || typeof response !== 'object') {
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }
      
      const messages = Array.isArray(response.messages) ? response.messages : []
      
      // 메시지가 없으면 환영 메시지 추가
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          messageId: Date.now(),
          userSeq: 0,
          userName: "시스템",
          userGrade: "SYSTEM",
          content: `${title}에 오신 것을 환영합니다! 첫 번째 메시지를 보내보세요.`,
          createdAt: new Date().toISOString(),
          messageType: "SYSTEM",
          roomType,
          isMyMessage: false,
          timeDisplay: "방금 전",
          deleted: false,
          readCount: 0,
          serverAllianceId: 0
        }
        setMessages([welcomeMessage])
      } else {
        setMessages(messages)
      }
      setHasMore(response.hasMore || false)
      
      // 초기 로드 완료 후 맨 아래로 스크롤 (자연스러운 단일 스크롤)
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true) // 한 번만 확실하게 스크롤
          // 스크롤 완료 후 무한스크롤 활성화
          setTimeout(() => {
            setAllowInfiniteScroll(true)
            allowInfiniteScrollRef.current = true
          }, 300)
        })
      }, 100)
      
    } catch (error) {
      // 에러 로그 간소화
      toast({
        title: "메시지 로드 실패",
        description: `${title} 채팅 메시지를 불러오는 중 오류가 발생했습니다. 오류: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      })
      
      // 오류 시 빈 환영 메시지라도 표시
      const welcomeMessage: ChatMessage = {
        messageId: Date.now(),
        userSeq: 0,
        userName: "시스템",
        userTag: "SYSTEM",
        content: `${title}에 오신 것을 환영합니다!`,
        createdAt: new Date().toISOString(),
        messageType: "SYSTEM",
        roomType,
        isMyMessage: false,
        timeDisplay: "방금 전",
        deleted: false,
        serverAllianceId: 0
      }
      setMessages([welcomeMessage])
      
      // 오류 시에도 스크롤 (자연스러운 단일 스크롤)
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true) // 한 번만 확실하게 스크롤
          // 에러 시에도 무한스크롤 활성화
          setTimeout(() => {
            setAllowInfiniteScroll(true)
            allowInfiniteScrollRef.current = true
          }, 300)
        })
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 메시지 더 로드 (무한스크롤) - 중복 호출 방지
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingHistory || !hasMore) {
      return
    }
    
    setIsLoadingHistory(true)
    
    try {
      // 현재 메시지에서 가장 오래된 메시지 ID 찾기
      const currentMessages = messages.filter(msg => msg.messageType !== "SYSTEM" && msg.userSeq !== 0)
      
      if (currentMessages.length === 0) {
        setHasMore(false)
        return
      }
      
      // 가장 작은 messageId 찾기
      const oldestMessage = currentMessages.reduce((oldest, current) => 
        current.messageId < oldest.messageId ? current : oldest
      )
      
      
      const response = await ChatService.getChatHistory({
        roomType,
        lastMessageId: oldestMessage.messageId,
        size: 15
      })
      
      if (!response || typeof response !== 'object') {
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }
      
      const newMessages = Array.isArray(response.messages) ? response.messages : []
      
      // hasMore는 항상 업데이트 (빈 결과여도 백엔드 판단을 신뢰)
      setHasMore(response.hasMore || false)
      
      if (newMessages.length > 0) {
        setMessages(prev => {
          const newMessageIds = new Set(newMessages.map(msg => msg.messageId))
          const filteredPrev = prev.filter(msg => !newMessageIds.has(msg.messageId))
          const mergedMessages = [...newMessages, ...filteredPrev]
          return mergedMessages
        })
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error)
      toast({
        title: "메시지 로드 실패",
        description: "이전 메시지를 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }, [messages, isLoadingHistory, hasMore, roomType, toast])

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    // 사용자 세션 확인
    if (!session?.user) {
      toast({
        title: "로그인 필요",
        description: "메시지를 전송하려면 로그인이 필요합니다.",
        variant: "destructive"
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      // WebSocket이 연결되어 있으면 WebSocket으로 우선 전송
      if (isConnected) {
        await sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
        // WebSocket으로 전송 시 실시간 수신 리스너에서 처리하므로 로컬 추가 안함
      } else {
        // WebSocket 연결이 없으면 REST API로 전송
        const sentMessage = await ChatService.sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
        
        // REST API 전송 시에만 로컬에 추가 (실시간 수신이 없으므로)
        setMessages(prev => [...prev, sentMessage])
        
        // 플로팅 버튼에 최신 메시지 ID 알림 (REST API 전송 시, 안전한 방식)
        if (onMessageUpdate && roomType === 'GLOBAL') {
          // 렌더링 중 상태 업데이트 방지
          setTimeout(() => {
            onMessageUpdate(sentMessage.messageId)
          }, 0)
        }
        
        // REST API 전송 후 즉시 스크롤
        setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToBottom(true)
          })
        }, 100)
      }
      
    } catch (error) {
      console.error("메시지 전송 실패:", error)
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      setNewMessage(messageContent) // 메시지 복원
    }
  }

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 스크롤 이벤트 throttling을 위한 ref
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const allowInfiniteScrollRef = useRef(false)

  // 스크롤 상단 도달 시 이전 메시지 로드 (극한 최적화)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget?.scrollTop
    const scrollHeight = e.currentTarget?.scrollHeight
    const clientHeight = e.currentTarget?.clientHeight
    
    // 무한스크롤이 허용되지 않거나 히스토리 로딩 중이거나 더 이상 로드할 메시지가 없으면 즉시 return
    if (!allowInfiniteScrollRef.current || isLoadingHistory || !hasMore) {
      return
    }
    
    // 스크롤이 상단 근처에 있을 때 무한스크롤 트리거 (매우 관대한 조건)
    if (scrollTop <= 100) { // 100px 이내면 상단으로 간주
      // 기존 타이머 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // throttling: 200ms로 더욱 단축하여 반응성 극대화
      scrollTimeoutRef.current = setTimeout(() => {
        loadMoreMessages()
      }, 200)
    }
  }, [hasMore, isLoadingHistory, loadMoreMessages])

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* 채팅방 헤더 */}
      <div className={`p-2.5 border-b bg-${color}-50 dark:bg-${color}-950 border-${color}-200 dark:border-${color}-800`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium text-${color}-800 dark:text-${color}-200`}>
                {title}
              </h3>
              {/* 연결 상태 인디케이터 */}
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs ${
                  isConnecting ? 'text-yellow-600' : 
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnecting ? '연결중' : 
                   isConnected ? '온라인' : 
                   lastError ? '오류' : '오프라인'}
                </span>
              </div>
            </div>
            <p className={`text-xs mt-0.5 ${
              color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
              color === 'green' ? 'text-green-600 dark:text-green-400' :
              'text-orange-600 dark:text-orange-400'
            }`}>
              {description} {onlineCount > 0 && `• ${onlineCount}명 접속중`}
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 목록 - 자동 스크롤 최적화 */}
      <div 
        className="h-[360px] sm:h-[390px] md:h-[440px] p-3 overflow-y-auto scroll-smooth scroll-container" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {isLoadingHistory && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="ml-2 text-sm text-gray-500">이전 메시지 로드 중...</span>
          </div>
        )}
        
        <div className="space-y-2 container">
          {useMemo(() => {
            // 무한스크롤을 위해 모든 메시지 렌더링 (성능보다 기능 우선)
            const visibleMessages = messages
            return visibleMessages.map((message, index) => (
              <div 
                key={message.messageId}
                className="gpu-accelerated"
              >
                <MessageBubble message={{...message, roomType}} />
              </div>
            ))
          }, [messages, roomType])}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력창 */}
      <div className="p-3 border-t bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              session?.user 
                ? `${title}에 메시지를 입력하세요...` 
                : "로그인이 필요합니다"
            }
            className="flex-1 h-10 text-sm"
            maxLength={1000}
            disabled={!session?.user}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !session?.user}
            size="sm"
            className={`h-10 px-4 ${
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