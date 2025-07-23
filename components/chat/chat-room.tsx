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
  
  // 메시지 제한 수 (메모리 최적화)
  const MAX_MESSAGES = 300
  
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

  // 메시지 목록의 끝으로 스크롤 (최적화된 로직)
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollAreaRef.current) return
    
    const scrollElement = scrollAreaRef.current
    const { scrollTop, scrollHeight, clientHeight } = scrollElement
    
    if (force) {
      // 강제 스크롤 - 단일 방법으로 최적화
      scrollElement.scrollTop = scrollHeight - clientHeight
    } else {
      // 일반 스크롤 - 사용자가 맨 아래 근처에 있는지 확인
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom) {
        scrollElement.scrollTop = scrollHeight - clientHeight
      }
    }
  }, [])

  // 중복 호출 방지를 위한 ref
  const isLoadingRef = useRef(false)

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    if (!isModalOpen) return // 모달이 열려있을 때만 로드
    
    // 중복 호출 방지
    if (isLoadingRef.current) return
    
    loadInitialMessages()
  }, [roomType, isModalOpen])

  // 새 메시지가 추가될 때 스크롤 (최적화된 로직)
  useEffect(() => {
    if (messages.length > 0) {
      // requestAnimationFrame으로 더 부드러운 스크롤
      const rafId = requestAnimationFrame(() => {
        scrollToBottom(false) // 조건부 스크롤
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [messages.length, scrollToBottom])

  // 실시간 메시지 수신 리스너 등록
  useEffect(() => {
    const removeListener = addMessageListener((newMessage: ChatMessage) => {
      // 현재 채팅방의 메시지만 처리
      if (newMessage.roomType === roomType) {
        setMessages(prev => {
          // 중복 메시지 방지 (O(1) Map 사용으로 성능 향상)
          const existingIds = new Set(prev.map(msg => msg.messageId))
          if (existingIds.has(newMessage.messageId)) {
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
          
          // 플로팅 버튼에 최신 메시지 ID 알림 (microtask로 최적화)
          if (onMessageUpdate && roomType === 'GLOBAL') {
            queueMicrotask(() => {
              onMessageUpdate(correctedMessage.messageId)
            })
          }
          
          const newMessages = [...prev, correctedMessage]
          
          // 메시지 수 제한 (메모리 최적화)
          if (newMessages.length > MAX_MESSAGES) {
            return newMessages.slice(-MAX_MESSAGES)
          }
          
          return newMessages
        })
      }
    })

    return removeListener
  }, [roomType, addMessageListener])

  // 초기 메시지 로드
  const loadInitialMessages = async () => {
    // 중복 호출 방지 - 이미 로딩 중이면 리턴
    if (isLoadingRef.current) {
      console.log('🚫 [CHAT] loadInitialMessages 중복 호출 방지')
      return
    }
    
    isLoadingRef.current = true
    setIsLoading(true)
    setAllowInfiniteScroll(false)
    allowInfiniteScrollRef.current = false
    
    try {
      await ChatService.joinChatRoom(roomType)
      
      const response = await ChatService.getChatHistory({
        roomType,
        size: 10
      })
      
      if (!response || typeof response !== 'object') {
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }
      
      const serverMessages = Array.isArray(response.messages) ? response.messages : []
      
      if (serverMessages.length === 0) {
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
        setMessages(serverMessages)
      }
      setHasMore(response.hasMore || false)
      
      // 스크롤 처리 (최적화)
      requestAnimationFrame(() => {
        scrollToBottom(true)
        // 무한스크롤 활성화 최적화
        setTimeout(() => {
          setAllowInfiniteScroll(true)
          allowInfiniteScrollRef.current = true
        }, 200)
      })
      
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
      
      // 오류 시에도 스크롤 (최적화)
      requestAnimationFrame(() => {
        scrollToBottom(true)
        // 에러 시에도 무한스크롤 활성화
        setTimeout(() => {
          setAllowInfiniteScroll(true)
          allowInfiniteScrollRef.current = true
        }, 200)
      })
    } finally {
      setIsLoading(false)
      // 로딩 완료 후 중복 방지 플래그 해제 (500ms 지연으로 연속 호출 방지)
      setTimeout(() => {
        isLoadingRef.current = false
      }, 500)
    }
  }

  // 간단하고 안정적인 무한스크롤
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingHistory || !hasMore || !scrollAreaRef.current || !allowInfiniteScrollRef.current) {
      return
    }
    
    setIsLoadingHistory(true)
    allowInfiniteScrollRef.current = false
    
    const container = scrollAreaRef.current
    const scrollHeightBeforeLoad = container.scrollHeight
    const scrollTopBeforeLoad = container.scrollTop
    
    try {
      const currentMessages = messages.filter(msg => msg.messageType !== "SYSTEM" && msg.userSeq !== 0)
      
      if (currentMessages.length === 0) {
        setHasMore(false)
        return
      }
      
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
      
      if (newMessages.length > 0) {
        setMessages(prev => {
          const newMessageIds = new Set(newMessages.map(msg => msg.messageId))
          const filteredPrev = prev.filter(msg => !newMessageIds.has(msg.messageId))
          const updatedMessages = [...newMessages, ...filteredPrev]
          
          // 실제로 새 메시지가 추가되지 않으면 hasMore를 false로 (비동기 최적화)
          if (updatedMessages.length === prev.length) {
            queueMicrotask(() => setHasMore(false))
          }
          
          return updatedMessages
        })
        
        // 스크롤 위치 유지
        requestAnimationFrame(() => {
          const scrollHeightAfterLoad = container.scrollHeight
          const heightDifference = scrollHeightAfterLoad - scrollHeightBeforeLoad
          container.scrollTop = scrollTopBeforeLoad + heightDifference
        })
      }
      
      // hasMore 업데이트
      setHasMore(response.hasMore || false)
      
    } catch (error) {
      console.error('메시지 로드 오류:', error)
      toast({
        title: "메시지 로드 실패",
        description: "이전 메시지를 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
      // 재활성화 최적화 (800ms로 단축)
      setTimeout(() => {
        allowInfiniteScrollRef.current = true
      }, 800)
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
        
        // 플로팅 버튼에 최신 메시지 ID 알림
        if (onMessageUpdate && roomType === 'GLOBAL') {
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

  // 슬랙 스타일 무한스크롤 트리거
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrollTop = element.scrollTop
    
    // 스크롤이 상단 근처에 있는지 체크 (20px 이내)
    const isAtTop = scrollTop <= 20
    
    if (!isAtTop || !allowInfiniteScrollRef.current || isLoadingHistory || !hasMore) {
      return
    }
    
    // 기존 타이머 클리어
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // 짧은 딜레이로 부드러운 로딩 (50ms로 더 반응성 향상)
    scrollTimeoutRef.current = setTimeout(() => {
      if (allowInfiniteScrollRef.current && !isLoadingHistory && hasMore) {
        loadMoreMessages()
      }
    }, 50)
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

      {/* 메시지 목록 - 슬랙 스타일 무한스크롤 (최적화) */}
      <div 
        className="h-[360px] sm:h-[390px] md:h-[440px] p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent will-change-scroll" 
        style={{ 
          scrollBehavior: 'auto', // 부드러운 스크롤 비활성화 (정확한 위치 제어)
          overflowAnchor: 'none', // 수동으로 위치 제어
          transform: 'translateZ(0)', // GPU 가속 강제 활성화
          backfaceVisibility: 'hidden' // 리페인트 최적화
        }}
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-4 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950 border-b border-blue-200 dark:border-blue-800 will-change-transform">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-blue-200 dark:border-blue-700">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent will-change-transform" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">이전 대화 불러오는 중...</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2 transform-gpu">
          {useMemo(() => {
            // 메시지 그룹화 최적화
            return messages.map((message, index) => {
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
              
              return (
                <div key={message.messageId} className="will-change-transform">
                  <MessageBubble 
                    message={{...message, roomType}} 
                    isLastInGroup={isLastInGroup}
                    isFirstInGroup={isFirstInGroup}
                  />
                </div>
              )
            })
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