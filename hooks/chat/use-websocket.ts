"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Client, Frame, IMessage } from "@stomp/stompjs"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@/lib/chat-service"
import { authStorage } from "@/lib/auth-api"

interface SendMessageRequest {
  roomType: "GLOBAL" | "INQUIRY"
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  content: string
  parentMessageId?: number
}

interface RealtimeEvent {
  eventType: "MESSAGE" | "USER_JOIN" | "USER_LEAVE" | "TYPING" | "ONLINE_COUNT" | "MESSAGE_HIDDEN" | "MESSAGE_UNHIDDEN"
  roomType: string
  message?: ChatMessage
  userName?: string
  userCount?: number
  timestamp: string
  // ADMIN 메시지 상태 변경용 필드들
  messageId?: number
  hiddenByAdmin?: boolean
  hiddenReason?: string
  hiddenAt?: string
}

// 메시지 이벤트 리스너 타입
type MessageEventListener = (message: ChatMessage) => void
type MessageUpdateListener = (update: { messageId: number; hiddenByAdmin: boolean; hiddenReason?: string; hiddenAt?: string }) => void
type EventListener = (event: RealtimeEvent) => void

/**
 * STOMP WebSocket 연결 및 실시간 채팅 관리 훅
 */
export function useWebSocket(roomType: "GLOBAL" | "INQUIRY" | null) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState(0)
  
  const stompClientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  // 이벤트 리스너들
  const messageListenersRef = useRef<MessageEventListener[]>([])
  const messageUpdateListenersRef = useRef<MessageUpdateListener[]>([])
  const eventListenersRef = useRef<EventListener[]>([])

  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  // STOMP WebSocket 연결
  const connect = useCallback(async () => {
    if (!roomType || isConnecting || isConnected) return

    // 세션 및 인증 정보 검증
    if (!session?.user?.serverAllianceId) {
      console.error("❌ WebSocket 연결 실패: 인증 정보가 부족합니다.", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasServerAllianceId: !!session?.user?.serverAllianceId
      })
      setLastError("인증 정보가 부족하여 실시간 채팅에 연결할 수 없습니다.")
      return
    }

    setIsConnecting(true)
    setLastError(null)

    try {
      // JWT 토큰 조회 (NextAuth 세션의 accessToken 사용)
      const accessToken = session?.accessToken || authStorage.getAccessToken()
      
      if (!accessToken) {
        console.error("❌ WebSocket 연결 실패: 액세스 토큰이 없습니다.")
        setLastError("인증 토큰이 없어 실시간 채팅에 연결할 수 없습니다.")
        setIsConnecting(false)
        return
      }
      
      // 연결 시도 로그 제거로 성능 향상
      
      // STOMP 클라이언트 생성
      const client = new Client({
        brokerURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
        connectHeaders: {
          // JWT 토큰을 Authorization 헤더에 포함
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          // 세션 사용자 정보 추가
          ...(session?.user && {
            'X-User-Id': session.user.id,
            'X-User-Name': session.user.name || '',
            'X-Server-Alliance-Id': session.user.serverAllianceId?.toString() || ''
          })
        },
        debug: (str) => {
          // WebSocket 연결 상태 디버깅
          if (str.includes('CONNECTED') || str.includes('ERROR') || str.includes('MESSAGE')) {
            console.log('🔗 STOMP:', str)
          }
        },
        reconnectDelay: reconnectInterval,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: Frame) => {
          console.log("STOMP 연결 성공:", frame)
          setIsConnected(true)
          setIsConnecting(false)
          reconnectAttempts.current = 0
          
          // 채팅방 구독 (roomType이 있는 경우에만)
          if (roomType) {
            subscribeToRoom(roomType)
          }
        },
        onStompError: (frame: Frame) => {
          console.error("STOMP 오류:", frame)
          setLastError(`STOMP 오류: ${frame.headers['message']}`)
          setIsConnecting(false)
        },
        onWebSocketClose: (event) => {
          console.log("WebSocket 연결 종료:", event)
          setIsConnected(false)
          setIsConnecting(false)
          
          // 자동 재연결 (정상 종료가 아닌 경우)
          if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
            scheduleReconnect()
          }
        },
        onWebSocketError: (error) => {
          console.error("WebSocket 오류:", error)
          setLastError("WebSocket 연결 오류가 발생했습니다.")
          setIsConnecting(false)
        }
      })

      stompClientRef.current = client
      client.activate()
      
    } catch (error) {
      console.error("STOMP 클라이언트 생성 실패:", error)
      setLastError("STOMP 클라이언트 생성에 실패했습니다.")
      setIsConnecting(false)
      scheduleReconnect()
    }
  }, [isConnecting, isConnected, roomType, session])

  // 재연결 스케줄링
  const scheduleReconnect = useCallback(() => {
    // 인증 정보가 없으면 재연결하지 않음
    if (!session?.user?.serverAllianceId) {
      console.warn("⚠️ 인증 정보가 없어 WebSocket 재연결을 중단합니다.")
      setLastError("인증 정보가 없어 재연결할 수 없습니다.")
      return
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setLastError(`WebSocket 연결 재시도 한계 (${maxReconnectAttempts}회)에 도달했습니다.`)
      return
    }

    reconnectAttempts.current++
    console.log(`🔄 WebSocket 재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, reconnectInterval * reconnectAttempts.current)
  }, [connect, session])

  // STOMP 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    
    if (stompClientRef.current && stompClientRef.current.active) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttempts.current = 0
  }, [])

  // 채팅방 구독
  const subscribeToRoom = useCallback((room: string) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.warn("STOMP 클라이언트가 연결되지 않았습니다.")
      return
    }

    try {
      // 기존 구독 해제
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      // 멀티테넌트 격리를 위한 serverAllianceId 추출
      const serverAllianceId = session?.user?.serverAllianceId
      if (!serverAllianceId) {
        console.error("❌ serverAllianceId가 없어 WebSocket 구독할 수 없습니다.")
        setLastError("인증 정보가 부족합니다.")
        return
      }

      // 채팅방 구독 경로 설정
      let topicPath: string;
      if (room === 'GLOBAL') {
        // GLOBAL 채팅은 모든 서버 사용자 대상
        topicPath = `/topic/chat/global`;
      } else {
        // 다른 채팅방은 서버연맹별 격리
        topicPath = `/topic/chat/${serverAllianceId}/${room.toLowerCase()}`;
      }
      console.log('🔔 채팅방 구독 경로:', topicPath)
      
      const subscription = stompClientRef.current.subscribe(
        topicPath, // server_alliance_id는 서버에서 JWT로 필터링
        (message: IMessage) => {
          console.log('📩 WebSocket 메시지 수신:', message.body)
          try {
            const realtimeEvent: RealtimeEvent = JSON.parse(message.body)
            handleIncomingEvent(realtimeEvent)
          } catch (error) {
            console.error("메시지 파싱 오류:", error, message.body)
          }
        }
      )

      subscriptionRef.current = subscription
      console.log(`채팅방 구독 완료: ${room}`)

      // 입장 알림
      stompClientRef.current.publish({
        destination: '/app/chat.join',
        body: JSON.stringify({
          roomType: room
        })
      })

    } catch (error) {
      console.error("채팅방 구독 실패:", error)
      setLastError("채팅방 구독에 실패했습니다.")
    }
  }, [session])

  // STOMP 메시지 전송
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!isConnected || !stompClientRef.current) {
      console.error("❌ STOMP 연결 안됨:", { isConnected, hasClient: !!stompClientRef.current })
      throw new Error("STOMP 클라이언트가 연결되지 않았습니다.")
    }

    try {
      console.log("📤 메시지 전송 시도:", request)
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(request)
      })
      
      console.log("✅ 메시지 전송 완료:", request.content)
      
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error)
      throw error
    }
  }, [isConnected])

  // 수신 이벤트 처리 - 실시간 채팅 디버깅
  const handleIncomingEvent = useCallback((event: RealtimeEvent) => {
    console.log('📨 실시간 이벤트 수신:', event.eventType, event.message?.content || `messageId: ${event.messageId}`)
    switch (event.eventType) {
      case "MESSAGE":
        // 새 메시지 도착
        if (event.message) {
          console.log('💬 새 메시지 전달:', event.message.userName, event.message.content)
          messageListenersRef.current.forEach(listener => {
            listener(event.message!)
          })
        }
        break

      case "MESSAGE_HIDDEN":
        // 메시지 가리기 이벤트
        if (event.messageId !== undefined) {
          console.log('🙈 메시지 가리기 이벤트:', event.messageId, event.hiddenReason)
          messageUpdateListenersRef.current.forEach(listener => {
            listener({
              messageId: event.messageId!,
              hiddenByAdmin: true,
              hiddenReason: event.hiddenReason,
              hiddenAt: event.hiddenAt
            })
          })
        }
        break

      case "MESSAGE_UNHIDDEN":
        // 메시지 가리기 해제 이벤트
        if (event.messageId !== undefined) {
          console.log('👁️ 메시지 가리기 해제 이벤트:', event.messageId)
          messageUpdateListenersRef.current.forEach(listener => {
            listener({
              messageId: event.messageId!,
              hiddenByAdmin: false,
              hiddenReason: undefined,
              hiddenAt: undefined
            })
          })
        }
        break
        
      case "USER_JOIN":
        // 사용자 입장 - 로그 제거
        break
        
      case "USER_LEAVE":
        // 사용자 퇴장 - 로그 제거
        break
        
      case "ONLINE_COUNT":
        // 온라인 사용자 수 업데이트
        if (event.userCount !== undefined) {
          setOnlineCount(event.userCount)
        }
        break
        
      case "TYPING":
        // 타이핑 상태 (추후 구현)
        break
        
      default:
        // 알 수 없는 이벤트 타입 - 로그 제거
    }
    
    // 모든 이벤트 리스너에게 알림
    eventListenersRef.current.forEach(listener => {
      listener(event)
    })
  }, [])

  // 메시지 리스너 등록
  const addMessageListener = useCallback((listener: MessageEventListener) => {
    if (!roomType) {
      // roomType이 null이면 빈 함수 반환
      return () => {}
    }
    
    messageListenersRef.current.push(listener)
    
    // 리스너 제거 함수 반환
    return () => {
      const index = messageListenersRef.current.indexOf(listener)
      if (index > -1) {
        messageListenersRef.current.splice(index, 1)
      }
    }
  }, [roomType])

  // 메시지 업데이트 리스너 등록
  const addMessageUpdateListener = useCallback((listener: MessageUpdateListener) => {
    if (!roomType) {
      // roomType이 null이면 빈 함수 반환
      return () => {}
    }
    
    messageUpdateListenersRef.current.push(listener)
    
    // 리스너 제거 함수 반환
    return () => {
      const index = messageUpdateListenersRef.current.indexOf(listener)
      if (index > -1) {
        messageUpdateListenersRef.current.splice(index, 1)
      }
    }
  }, [roomType])

  // 이벤트 리스너 등록
  const addEventListener = useCallback((listener: EventListener) => {
    eventListenersRef.current.push(listener)
    
    // 리스너 제거 함수 반환
    return () => {
      const index = eventListenersRef.current.indexOf(listener)
      if (index > -1) {
        eventListenersRef.current.splice(index, 1)
      }
    }
  }, [])

  // 컴포넌트 마운트 시 연결 (최적화)
  useEffect(() => {
    // roomType이 있고 연결되지 않은 경우에만 연결 시도
    if (roomType && !isConnected && !isConnecting) {
      connect()
    }
    
    // 컴포넌트 언마운트 시 연결 해제
    return disconnect
  }, [roomType]) // roomType 변경 시에도 재연결

  // 채팅방 변경 시 재구독 (최적화)
  useEffect(() => {
    // 연결된 상태이고 roomType이 변경된 경우에만 재구독
    if (isConnected && roomType) {
      subscribeToRoom(roomType)
    }
  }, [roomType, isConnected]) // subscribeToRoom 의존성 제거로 무한 루프 방지

  return {
    isConnected,
    isConnecting,
    lastError,
    onlineCount,
    connect,
    disconnect,
    sendMessage,
    addMessageListener,
    addMessageUpdateListener,
    addEventListener,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  }
}