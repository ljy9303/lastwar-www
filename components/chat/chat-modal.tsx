"use client"

import React, { useState, memo } from "react"
import { X, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChatTabs } from "./chat-tabs"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  onMessageUpdate?: (messageId: number) => void
}

/**
 * 채팅 모달 컴포넌트
 * 카카오톡 스타일의 채팅 인터페이스
 */
const ChatModal = memo(function ChatModal({ isOpen, onClose, onMessageUpdate }: ChatModalProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <>
      {isOpen && (
        <>
          {/* 모바일 백드롭 */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] md:hidden"
            onClick={onClose}
          />

          {/* 채팅 모달 - 부드러운 애니메이션 */}
          <div
            className={`fixed bottom-24 right-6 z-[10001] gpu-accelerated chat-modal transition-all duration-300 ease-out ${
              isMinimized ? 'translate-x-[calc(100%-200px)] translate-y-[calc(100%-60px)]' : ''
            }`}
            style={{
              opacity: 1,
              transform: `scale(1) ${isMinimized ? 'translate(calc(100% - 200px), calc(100% - 60px))' : 'translate(0, 0)'}`
            }}
          >
            <Card 
              className={`shadow-2xl border-0 overflow-hidden rounded-2xl container ${
                isMinimized 
                  ? "w-48 h-14" 
                  : "w-[380px] h-[520px] sm:w-[400px] sm:h-[560px] md:w-[440px] md:h-[640px]"
              }`}
            >
              {/* 채팅 내용 - 모달 오픈 상태 전달 */}
              {!isMinimized && (
                <div className="h-full overflow-hidden">
                  <ChatTabs 
                    isModalOpen={isOpen} 
                    onMessageUpdate={onMessageUpdate}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
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