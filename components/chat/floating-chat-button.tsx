"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { createPortal } from "react-dom"
import { MessageCircle, X } from "lucide-react"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { ChatModal } from "./chat-modal"
import { useWebSocket } from "@/hooks/chat/use-websocket"
import { useMobileKeyboardWithCSSVars } from "@/hooks/use-mobile-keyboard"
import { getLastReadMessageId, saveLastReadMessage } from "@/lib/chat-storage"
import { ChatService, type ChatMessage } from "@/lib/chat-service"

/**
 * 플로팅 채팅 버튼 컴포넌트
 * 단순한 실시간 채팅 인터페이스
 */
const FloatingChatButton = memo(function FloatingChatButton() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null)

  // 모바일 키보드 상태 감지 (CSS 변수 자동 설정)
  const keyboard = useMobileKeyboardWithCSSVars({
    threshold: 150,
    debounceMs: 100,
    transitionMs: 300
  })

  // 인증된 사용자만 WebSocket 연결
  const shouldConnectWebSocket = status === 'authenticated' && session?.user
  const { addMessageListener } = useWebSocket(shouldConnectWebSocket ? 'GLOBAL' : null)

  useEffect(() => {
    // 클라이언트 사이드에서만 마운트 상태 설정
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // 인증된 사용자만 최신 메시지 확인
  useEffect(() => {
    if (mounted && status === 'authenticated' && session?.user) {
      checkLatestMessage()
    }
  }, [mounted, status, session])

  // 인증된 사용자만 실시간 메시지 수신 감지
  useEffect(() => {
    if (!shouldConnectWebSocket) return

    const removeListener = addMessageListener((newMessage: ChatMessage) => {
      console.log('🔔 실시간 메시지 수신 (백그라운드):', newMessage.messageId, newMessage.content)
      
      // 모달이 닫혀있을 때만 미열람 체크
      if (!isOpen) {
        checkUnreadStatus(newMessage.messageId)
      }
    })

    return removeListener
  }, [isOpen, shouldConnectWebSocket]) // addMessageListener 의존성 제거로 무한 루프 방지

  // 로그인/회원가입 페이지에서는 플로팅 버튼 숨기기
  const hiddenPaths = ['/login', '/test-login', '/signup', '/auth/kakao/callback']
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path)) || !shouldConnectWebSocket

  // 미열람 상태 확인 (useCallback으로 최적화)
  const checkUnreadStatus = useCallback((messageId: number) => {
    const lastReadId = getLastReadMessageId('GLOBAL')
    const hasNewUnread = lastReadId === null || messageId > lastReadId
    
    console.log('📊 미열람 체크:', { messageId, lastReadId, hasNewUnread })
    setHasUnread(hasNewUnread)
  }, [])

  // 최신 메시지 확인 (useCallback으로 최적화)
  const checkLatestMessage = useCallback(async () => {
    // 인증되지 않은 사용자는 API 호출하지 않음
    if (!session?.user || !session?.accessToken) {
      console.log('[CHAT] 인증되지 않은 사용자 - 최신 메시지 확인 건너뜀')
      return
    }
    
    try {
      const response = await ChatService.getChatHistory({
        roomType: 'GLOBAL',
        size: 1 // 최신 1개만
      })
      
      if (response.messages && response.messages.length > 0) {
        const latestMessage = response.messages[0]
        setLatestMessageId(latestMessage.messageId)
        checkUnreadStatus(latestMessage.messageId)
      }
    } catch (error) {
      console.warn('최신 메시지 확인 실패:', error)
    }
  }, [session?.user, session?.accessToken, checkUnreadStatus])

  // 메시지 업데이트 콜백 (Hook 순서 안정화)
  const handleMessageUpdate = useCallback((messageId: number) => {
    // 렌더링 중 상태 업데이트 방지 - 다음 렌더 사이클에서 실행
    setTimeout(() => {
      setLatestMessageId(messageId)
      console.log('📨 채팅방에서 메시지 업데이트:', messageId)
    }, 0)
  }, [])

  // 모달 열기/닫기
  const toggleChat = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    // 모달을 닫을 때 마지막 메시지를 읽음으로 표시
    if (!newIsOpen && latestMessageId) {
      saveLastReadMessage('GLOBAL', latestMessageId)
      setHasUnread(false)
      console.log('💾 모달 닫기 - 마지막 메시지 읽음 처리:', latestMessageId)
    }
  }

  // 숨겨야 하는 페이지이거나 마운트되지 않았거나 인증되지 않은 경우 렌더링하지 않음
  if (shouldHide || !mounted || status === 'loading' || status === 'unauthenticated') {
    return null
  }

  const buttonContent = (
    <>
      {/* 플로팅 채팅 버튼 - 키보드 대응 및 Safe Area 지원 */}
      <div
        className="fixed z-[9999] pointer-events-auto transition-all duration-300 ease-out"
        style={{
          // 키보드가 나타났을 때 위치 조정
          bottom: keyboard.isVisible ? `${Math.max(16, keyboard.height + 16)}px` : undefined,
          right: '16px',
          // 키보드가 없을 때 기본 위치 (CSS env() Safe Area 지원)
          ...(!keyboard.isVisible && {
            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            right: 'max(16px, env(safe-area-inset-right, 16px))'
          })
        }}
      >
        <div className="gpu-accelerated relative">
          {/* 메인 채팅 버튼 - 모바일 최적화 */}
          <OptimizedTouchButton
            onClick={toggleChat}
            size="lg"
            enableHaptics={true}
            enableRipple={true}
            className="w-15 h-15 xs:w-16 xs:h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg p-0 chat-button transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={isOpen ? "채팅창 닫기" : "채팅창 열기"}
          >
            {isOpen ? (
              <X className="h-6 w-6 xs:h-7 xs:w-7 text-white" />
            ) : (
              <MessageCircle className="h-6 w-6 xs:h-7 xs:w-7 text-white" />
            )}
          </OptimizedTouchButton>
          
          {/* 미열람 메시지 빨간점 표시 - 접근성 개선 */}
          {!isOpen && hasUnread && (
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 xs:w-5 xs:h-5 bg-red-500 rounded-full border-2 border-white animate-pulse"
              style={{
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
              role="img"
              aria-label="읽지 않은 메시지 있음"
            />
          )}
        </div>
      </div>

      {/* 채팅 모달 */}
      <ChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onMessageUpdate={handleMessageUpdate}
        keyboardState={keyboard}
      />
    </>
  )

  return createPortal(buttonContent, document.body)
})

// displayName 설정 (React DevTools용)
FloatingChatButton.displayName = 'FloatingChatButton'

export { FloatingChatButton }