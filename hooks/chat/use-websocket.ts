"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface SendMessageRequest {
  roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  content: string
  parentMessageId?: number
}

interface WebSocketMessage {
  eventType: string
  roomType: string
  message?: any
  userName?: string
  timestamp: string
}

/**
 * WebSocket 연결 및 실시간 채팅 관리 훅
 */
export function useWebSocket(roomType: "GLOBAL" | "ALLIANCE" | "INQUIRY") {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  
  const socketRef = useRef<WebSocket | null>(null)
  const stompClientRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const maxReconnectAttempts = 5
  const reconnectInterval = 3000

  // WebSocket 연결
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setLastError(null)

    try {
      // WebSocket 서버 URL (환경변수에서 가져오기)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws"
      
      // TODO: STOMP over WebSocket 구현
      // 현재는 기본 WebSocket으로 임시 구현
      const socket = new WebSocket(wsUrl)
      
      socket.onopen = () => {
        console.log("WebSocket 연결 성공")
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttempts.current = 0
        
        // 채팅방 구독
        subscribeToRoom(roomType)
      }
      
      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleIncomingMessage(message)
        } catch (error) {
          console.error("메시지 파싱 오류:", error)
        }
      }
      
      socket.onclose = (event) => {
        console.log("WebSocket 연결 종료:", event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        socketRef.current = null
        
        // 자동 재연결 (정상 종료가 아닌 경우)
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }
      
      socket.onerror = (error) => {
        console.error("WebSocket 오류:", error)
        setLastError("WebSocket 연결 오류가 발생했습니다.")
        setIsConnecting(false)
      }
      
      socketRef.current = socket
      
    } catch (error) {
      console.error("WebSocket 연결 실패:", error)
      setLastError("WebSocket 연결에 실패했습니다.")
      setIsConnecting(false)
      scheduleReconnect()
    }
  }, [isConnecting, isConnected, roomType])

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

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, "사용자 요청에 의한 연결 종료")
      socketRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttempts.current = 0
  }, [])

  // 채팅방 구독
  const subscribeToRoom = useCallback((room: string) => {
    // TODO: STOMP 구독 구현
    console.log(`채팅방 구독: ${room}`)
    
    // 임시 구현: 서버에 구독 메시지 전송
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        action: "subscribe",
        roomType: room,
        timestamp: new Date().toISOString()
      }
      
      socketRef.current.send(JSON.stringify(subscribeMessage))
    }
  }, [])

  // 메시지 전송
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!isConnected || !socketRef.current) {
      throw new Error("WebSocket이 연결되지 않았습니다.")
    }

    try {
      const message = {
        action: "sendMessage",
        ...request,
        timestamp: new Date().toISOString()
      }
      
      socketRef.current.send(JSON.stringify(message))
      console.log("메시지 전송:", message)
      
    } catch (error) {
      console.error("메시지 전송 실패:", error)
      throw error
    }
  }, [isConnected])

  // 수신 메시지 처리
  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    console.log("수신 메시지:", message)
    
    // TODO: 메시지 타입별 처리 로직 구현
    switch (message.eventType) {
      case "MESSAGE":
        // 새 메시지 이벤트
        break
      case "USER_JOIN":
        // 사용자 입장 이벤트
        break
      case "USER_LEAVE":
        // 사용자 퇴장 이벤트
        break
      case "TYPING":
        // 타이핑 상태 이벤트
        break
      default:
        console.warn("알 수 없는 메시지 타입:", message.eventType)
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
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  }
}