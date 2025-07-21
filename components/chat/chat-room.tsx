"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useToast } from "@/hooks/use-toast"
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // WebSocket 연결 (추후 구현)
  const { isConnected, sendMessage } = useWebSocket(roomType)

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

  // 초기 메시지 로드
  const loadInitialMessages = async () => {
    setIsLoading(true)
    try {
      // 채팅방 입장 처리
      await ChatService.joinChatRoom(roomType)
      
      // 최신 메시지 20개 로드
      const response = await ChatService.getChatHistory({
        roomType,
        size: 20
      })
      
      setMessages(response.messages)
      setHasMore(response.hasMore)
      
    } catch (error) {
      console.error("초기 메시지 로드 실패:", error)
      toast({
        title: "메시지 로드 실패",
        description: "채팅 메시지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
      
      // 오류 시 빈 환영 메시지라도 표시
      const welcomeMessage: ChatMessage = {
        messageId: Date.now(),
        userSeq: 0,
        userName: "시스템",
        userGrade: "SYSTEM",
        content: `${title}에 오신 것을 환영합니다!`,
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
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 메시지 더 로드 (무한스크롤)
  const loadMoreMessages = async () => {
    if (isLoadingHistory || !hasMore || messages.length === 0) return
    
    setIsLoadingHistory(true)
    try {
      // 가장 오래된 메시지 ID를 기준으로 이전 메시지 로드
      const oldestMessageId = messages[0]?.messageId
      
      const response = await ChatService.getChatHistory({
        roomType,
        lastMessageId: oldestMessageId,
        size: 20
      })
      
      if (response.messages.length > 0) {
        // 기존 메시지 앞에 이전 메시지들 추가
        setMessages(prev => [...response.messages, ...prev])
        setHasMore(response.hasMore)
      } else {
        setHasMore(false)
      }
      
    } catch (error) {
      console.error("이전 메시지 로드 실패:", error)
      toast({
        title: "이전 메시지 로드 실패",
        description: "이전 메시지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      // WebSocket이 연결되어 있으면 WebSocket으로, 아니면 REST API로 전송
      if (isConnected) {
        await sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
      } else {
        // REST API로 메시지 전송
        const sentMessage = await ChatService.sendMessage({
          roomType,
          messageType: "TEXT",
          content: messageContent
        })
        
        // 성공적으로 전송된 메시지를 로컬에 추가
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
      <div className={`p-3 border-b bg-${color}-50 dark:bg-${color}-950 border-${color}-200 dark:border-${color}-800`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium text-${color}-800 dark:text-${color}-200`}>
              {title}
            </h3>
            <p className={`text-xs text-${color}-600 dark:text-${color}-400`}>
              {description}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <ScrollArea 
        className="flex-1 p-3" 
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}
      >
        {isLoadingHistory && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="ml-2 text-sm text-gray-500">이전 메시지 로드 중...</span>
          </div>
        )}
        
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.messageId} message={message} />
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
            placeholder={`${title}에 메시지를 입력하세요...`}
            className="flex-1"
            maxLength={1000}
            disabled={false}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className={`bg-${color}-600 hover:bg-${color}-700`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs mt-1 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isConnected ? 'WebSocket 연결됨' : 'REST API 모드'}
        </p>
      </div>
    </div>
  )
}