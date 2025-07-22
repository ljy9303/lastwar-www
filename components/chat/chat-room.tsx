"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ChatService, type ChatMessage } from "@/lib/chat-service"

interface ChatRoomProps {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  title: string
  description: string
  color: "purple" | "green" | "orange"
}

// ChatMessage 인터페이스는 ChatService에서 import

/**
 * 채팅방 컴포넌트
 * 카카오톡 스타일의 실시간 채팅 인터페이스
 */
export function ChatRoom({ roomType, title, description, color }: ChatRoomProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
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

  // 메시지 목록의 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    loadInitialMessages()
  }, [roomType])

  // 새 메시지가 추가될 때 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 실시간 메시지 수신 리스너 등록
  useEffect(() => {
    const removeListener = addMessageListener((newMessage: ChatMessage) => {
      // 현재 채팅방의 메시지만 처리
      if (newMessage.roomType === roomType) {
        setMessages(prev => {
          // 중복 메시지 방지
          const exists = prev.some(msg => msg.messageId === newMessage.messageId)
          if (exists) return prev
          
          // 실시간 메시지의 isMyMessage를 현재 사용자 기준으로 재계산
          // session.user.id (userId)와 newMessage.userSeq를 비교하거나, 사용자명으로도 확인
          const isMyMessage = session?.user && (
            newMessage.userSeq === parseInt(session.user.id) ||
            newMessage.userName === session.user.name
          )
          
          const correctedMessage = {
            ...newMessage,
            isMyMessage: !!isMyMessage
          }
          
          console.log(`[CHAT] 실시간 메시지 수신 - 작성자: ${newMessage.userName} (userSeq: ${newMessage.userSeq}), 현재 사용자: ${session?.user?.name} (id: ${session?.user?.id}), isMyMessage: ${correctedMessage.isMyMessage}`)
          
          return [...prev, correctedMessage]
        })
      }
    })

    return removeListener
  }, [roomType, session?.user]) // session.user 의존성 추가

  // 초기 메시지 로드
  const loadInitialMessages = async () => {
    setIsLoading(true)
    try {
      console.log(`[CHAT] ${roomType} 채팅방 초기 메시지 로드 시작`)
      
      // 채팅방 입장 처리
      await ChatService.joinChatRoom(roomType)
      console.log(`[CHAT] ${roomType} 채팅방 입장 완료`)
      
      // 최신 메시지 20개 로드
      const response = await ChatService.getChatHistory({
        roomType,
        size: 20
      })
      
      // 응답 검증
      if (!response || typeof response !== 'object') {
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }
      
      const messages = Array.isArray(response.messages) ? response.messages : []
      console.log(`[CHAT] ${roomType} 초기 메시지 로드 완료:`, messages.length, "개 메시지")
      
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
      
    } catch (error) {
      console.error(`[CHAT] ${roomType} 초기 메시지 로드 실패:`, error)
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
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 메시지 더 로드 (무한스크롤)
  const loadMoreMessages = async () => {
    if (isLoadingHistory || !hasMore || messages.length === 0) {
      console.log(`[CHAT] ${roomType} 이전 메시지 로드 스킵:`, {
        isLoadingHistory,
        hasMore,
        messagesLength: messages.length
      })
      return
    }
    
    // 시스템 메시지(환영 메시지)만 있는 경우 이전 메시지 로드 중단
    const realMessages = messages.filter(msg => msg.messageType !== "SYSTEM" && msg.userSeq !== 0)
    if (realMessages.length === 0) {
      console.log(`[CHAT] ${roomType} 실제 메시지가 없어 이전 메시지 로드 스킵`)
      setHasMore(false)
      return
    }
    
    console.log(`[CHAT] ${roomType} 이전 메시지 로드 시작`)
    setIsLoadingHistory(true)
    try {
      // 가장 오래된 실제 메시지 ID를 기준으로 이전 메시지 로드
      const oldestMessageId = realMessages[0]?.messageId
      console.log(`[CHAT] ${roomType} 기준 메시지 ID:`, oldestMessageId)
      
      if (!oldestMessageId) {
        console.log(`[CHAT] ${roomType} 기준 메시지 ID가 없어 로드 중단`)
        setHasMore(false)
        return
      }
      
      const response = await ChatService.getChatHistory({
        roomType,
        lastMessageId: oldestMessageId,
        size: 20
      })
      
      // 응답 검증
      if (!response || typeof response !== 'object') {
        throw new Error('서버에서 올바르지 않은 응답을 받았습니다.')
      }
      
      const messages = Array.isArray(response.messages) ? response.messages : []
      console.log(`[CHAT] ${roomType} 이전 메시지 로드 응답:`, {
        messagesCount: messages.length,
        hasMore: response.hasMore,
        totalCount: response.totalCount,
        nextLastMessageId: response.nextLastMessageId
      })
      
      if (messages.length > 0) {
        // 기존 메시지 앞에 이전 메시지들 추가 (중복 제거)
        setMessages(prev => {
          const newMessageIds = new Set(messages.map(msg => msg.messageId))
          const filteredPrev = prev.filter(msg => !newMessageIds.has(msg.messageId))
          return [...messages, ...filteredPrev]
        })
        setHasMore(response.hasMore || false)
      } else {
        console.log(`[CHAT] ${roomType} 더 이상 로드할 메시지가 없음`)
        setHasMore(false)
      }
      
    } catch (error) {
      console.error(`[CHAT] ${roomType} 이전 메시지 로드 실패:`, error)
      
      // 더 구체적인 오류 메시지 표시
      let errorMessage = "이전 메시지를 불러오는 중 오류가 발생했습니다."
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요."
        } else if (error.message.includes('403')) {
          errorMessage = "해당 채팅방에 접근 권한이 없습니다."
        } else if (error.message.includes('500')) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        } else {
          errorMessage = `오류: ${error.message}`
        }
      }
      
      toast({
        title: "이전 메시지 로드 실패",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

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

  // 스크롤 상단 도달 시 이전 메시지 로드
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget
    if (scrollTop === 0 && hasMore && !isLoadingHistory) {
      loadMoreMessages()
    }
  }

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

      {/* 메시지 목록 */}
      <ScrollArea 
        className="h-[360px] sm:h-[390px] md:h-[440px] p-3" 
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        {isLoadingHistory && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="ml-2 text-sm text-gray-500">이전 메시지 로드 중...</span>
          </div>
        )}
        
        <div className="space-y-2">
          {messages.map((message) => (
            <MessageBubble key={message.messageId} message={{...message, roomType}} />
          ))}
        </div>
        
        <div ref={messagesEndRef} />
      </ScrollArea>

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
}