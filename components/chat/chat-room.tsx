"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useToast } from "@/hooks/use-toast"

interface ChatRoomProps {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  title: string
  description: string
  color: "purple" | "green" | "orange"
}

interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userGrade?: string
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  isMyMessage: boolean
  timeDisplay: string
}

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
      // TODO: API 호출로 초기 메시지 로드
      const mockMessages: ChatMessage[] = [
        {
          messageId: 1,
          userSeq: 1,
          userName: "관리자",
          userGrade: "R5",
          content: `${title}에 오신 것을 환영합니다!`,
          createdAt: new Date().toISOString(),
          messageType: "SYSTEM",
          isMyMessage: false,
          timeDisplay: "방금 전"
        },
        {
          messageId: 2,
          userSeq: 2,
          userName: "연맹원123",
          userGrade: "R4",
          content: "안녕하세요! 새로운 채팅 시스템이 좋네요",
          createdAt: new Date().toISOString(),
          messageType: "TEXT",
          isMyMessage: false,
          timeDisplay: "1분 전"
        },
        {
          messageId: 3,
          userSeq: 100, // 현재 사용자 가정
          userName: "나",
          userGrade: "R3",
          content: "테스트 메시지입니다",
          createdAt: new Date().toISOString(),
          messageType: "TEXT",
          isMyMessage: true,
          timeDisplay: "방금 전"
        }
      ]
      
      setMessages(mockMessages)
    } catch (error) {
      toast({
        title: "메시지 로드 실패",
        description: "채팅 메시지를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 이전 메시지 더 로드 (무한스크롤)
  const loadMoreMessages = async () => {
    if (isLoadingHistory || !hasMore) return
    
    setIsLoadingHistory(true)
    try {
      // TODO: API 호출로 이전 메시지 로드
      // const lastMessageId = messages[0]?.messageId
      // const response = await fetchChatHistory(roomType, lastMessageId)
      
      // 임시 목업 데이터
      await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
      
      const olderMessages: ChatMessage[] = [
        {
          messageId: 0,
          userSeq: 3,
          userName: "이전사용자",
          userGrade: "R2",
          content: "이전 메시지입니다",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          messageType: "TEXT",
          isMyMessage: false,
          timeDisplay: "1시간 전"
        }
      ]
      
      setMessages(prev => [...olderMessages, ...prev])
      setHasMore(false) // 더 이상 로드할 메시지 없음
    } catch (error) {
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
    if (!isConnected) {
      toast({
        title: "연결 오류",
        description: "채팅 서버에 연결되지 않았습니다.",
        variant: "destructive"
      })
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      // WebSocket으로 메시지 전송
      await sendMessage({
        roomType,
        messageType: "TEXT",
        content: messageContent
      })

      // 임시로 로컬 메시지 추가 (실제로는 WebSocket 응답으로 처리)
      const tempMessage: ChatMessage = {
        messageId: Date.now(),
        userSeq: 100, // 현재 사용자
        userName: "나",
        userGrade: "R3",
        content: messageContent,
        createdAt: new Date().toISOString(),
        messageType: "TEXT",
        isMyMessage: true,
        timeDisplay: "방금 전"
      }
      
      setMessages(prev => [...prev, tempMessage])
    } catch (error) {
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
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
            className={`bg-${color}-600 hover:bg-${color}-700`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">
            서버에 연결 중입니다...
          </p>
        )}
      </div>
    </div>
  )
}