"use client"

import React, { useState, memo } from "react"
import { X, Minimize2 } from "lucide-react"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Card } from "@/components/ui/card"
import { ChatTabs } from "./chat-tabs"

interface MobileKeyboardState {
  isVisible: boolean
  height: number
  viewportHeight: number
  screenHeight: number
  isTransitioning: boolean
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  onMessageUpdate?: (messageId: number) => void
  keyboardState?: MobileKeyboardState
}

/**
 * 채팅 모달 컴포넌트
 * 카카오톡 스타일의 채팅 인터페이스 - 모바일 최적화
 */
const ChatModal = memo(function ChatModal({ isOpen, onClose, onMessageUpdate, keyboardState }: ChatModalProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  // 키보드 상태에 따른 모달 위치 및 크기 계산
  const getModalStyles = () => {
    if (isMinimized) {
      return {
        bottom: '96px', // 플로팅 버튼 위
        right: '16px',
        transform: 'none'
      }
    }

    // 키보드가 표시된 경우
    if (keyboardState?.isVisible) {
      return {
        bottom: `${keyboardState.height}px`,
        left: '8px',
        right: '8px',
        height: `calc(${keyboardState.viewportHeight}px - 16px)`,
        transform: 'none'
      }
    }

    // 기본 상태 (Safe Area 지원)
    return {
      bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      left: '8px',
      right: '8px',
      height: 'calc(100vh - 32px - max(16px, env(safe-area-inset-bottom, 16px)) - max(16px, env(safe-area-inset-top, 16px)))',
      // 데스크톱에서는 고정 크기
      '@media (min-width: 480px)': {
        left: 'auto',
        right: 'max(16px, env(safe-area-inset-right, 16px))',
        width: '380px',
        height: '546px'
      }
    }
  }

  return (
    <>
      {isOpen && (
        <>
          {/* 모바일 백드롭 - 터치 최적화 */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] xs:hidden touch-optimized"
            onClick={onClose}
            role="button"
            aria-label="채팅창 닫기"
            tabIndex={-1}
          />

          {/* 채팅 모달 - 키보드 대응 및 Safe Area 지원 */}
          <div
            className={`fixed z-[10001] gpu-accelerated chat-modal transition-all duration-300 ease-out ${
              keyboardState?.isTransitioning ? 'transition-all' : ''
            }`}
            style={getModalStyles()}
          >
            <Card 
              className={`shadow-2xl border-0 overflow-hidden h-full ${
                isMinimized 
                  ? "w-48 h-14 rounded-2xl" 
                  : "w-full xs:rounded-2xl rounded-t-2xl"
              }`}
            >
              {/* 채팅 내용 - 모달 오픈 상태 전달 */}
              {!isMinimized && (
                <div className="h-full overflow-hidden">
                  <ChatTabs 
                    isModalOpen={isOpen} 
                    onMessageUpdate={onMessageUpdate}
                    onClose={onClose}
                    keyboardState={keyboardState}
                  />
                </div>
              )}
              
              {/* 최소화 상태일 때만 간단한 헤더 표시 */}
              {isMinimized && (
                <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-medium text-sm">채팅</span>
                  </div>
                  <OptimizedTouchButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                    enableHaptics={true}
                    enableRipple={false}
                    aria-label="채팅창 확대"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </OptimizedTouchButton>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
})

// displayName 설정 (React DevTools용)
ChatModal.displayName = 'ChatModal'

export { ChatModal }