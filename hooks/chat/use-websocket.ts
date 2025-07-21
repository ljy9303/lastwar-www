"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Client, Frame, IMessage } from "@stomp/stompjs"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@/lib/chat-service"
import { authStorage } from "@/lib/auth-api"

interface SendMessageRequest {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  content: string
  parentMessageId?: number
}

interface RealtimeEvent {
  eventType: "MESSAGE" | "USER_JOIN" | "USER_LEAVE" | "TYPING" | "ONLINE_COUNT"
  roomType: string
  message?: ChatMessage
  userName?: string
  userCount?: number
  timestamp: string
}

// 메시지 이벤트 리스너 타입
type MessageEventListener = (message: ChatMessage) => void
type EventListener = (event: RealtimeEvent) => void

/**
 * STOMP WebSocket 연결 및 실시간 채팅 관리 훅
 */
export function useWebSocket(roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY") {
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
  const eventListenersRef = useRef<EventListener[]>([])

  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  // STOMP WebSocket 연결
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setLastError(null)

    try {
      // JWT 토큰 조회
      const accessToken = authStorage.getAccessToken()
      
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
          console.log('STOMP Debug:', str)
        },
        reconnectDelay: reconnectInterval,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: Frame) => {
          console.log("STOMP 연결 성공:", frame)
          setIsConnected(true)
          setIsConnecting(false)
          reconnectAttempts.current = 0
          
          // 채팅방 구독
          subscribeToRoom(roomType)
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
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setLastError("WebSocket 연결을 재시도할 수 없습니다.")
      return
    }

    reconnectAttempts.current++
    console.log(`WebSocket 재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, reconnectInterval * reconnectAttempts.current)
  }, [connect])

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

      // 새 채팅방 구독 - 서버 연맹 ID는 JWT에서 추출됨
      const subscription = stompClientRef.current.subscribe(
        `/topic/chat/*/` + room.toLowerCase(), // server_alliance_id는 서버에서 JWT로 필터링
        (message: IMessage) => {
          try {
            const realtimeEvent: RealtimeEvent = JSON.parse(message.body)
            handleIncomingEvent(realtimeEvent)
          } catch (error) {
            console.error("메시지 파싱 오류:", error)
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
  }, [])

  // STOMP 메시지 전송
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!isConnected || !stompClientRef.current) {
      throw new Error("STOMP 클라이언트가 연결되지 않았습니다.")
    }

    try {
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(request)
      })
      
      console.log("메시지 전송:", request)
      
    } catch (error) {
      console.error("메시지 전송 실패:", error)
      throw error
    }
  }, [isConnected])

  // 수신 이벤트 처리
  const handleIncomingEvent = useCallback((event: RealtimeEvent) => {
    console.log("수신 이벤트:", event)
    
    switch (event.eventType) {
      case "MESSAGE":
        // 새 메시지 도착
        if (event.message) {
          messageListenersRef.current.forEach(listener => {
            listener(event.message!)
          })
        }
        break
        
      case "USER_JOIN":
        // 사용자 입장
        console.log(`${event.userName}님이 입장했습니다.`)
        break
        
      case "USER_LEAVE":
        // 사용자 퇴장
        console.log(`${event.userName}님이 퇴장했습니다.`)
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
        console.warn("알 수 없는 이벤트 타입:", event.eventType)
    }
    
    // 모든 이벤트 리스너에게 알림
    eventListenersRef.current.forEach(listener => {
      listener(event)
    })
  }, [])

  // 메시지 리스너 등록
  const addMessageListener = useCallback((listener: MessageEventListener) => {
    messageListenersRef.current.push(listener)
    
    // 리스너 제거 함수 반환
    return () => {
      const index = messageListenersRef.current.indexOf(listener)
      if (index > -1) {
        messageListenersRef.current.splice(index, 1)
      }
    }
  }, [])

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

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    connect()
    
    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // 채팅방 변경 시 재구독
  useEffect(() => {
    if (isConnected) {
      subscribeToRoom(roomType)
    }
  }, [roomType, isConnected, subscribeToRoom])

  return {
    isConnected,
    isConnecting,
    lastError,
    onlineCount,
    connect,
    disconnect,
    sendMessage,
    addMessageListener,
    addEventListener,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  }
}