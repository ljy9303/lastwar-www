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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] xs:hidden"
            onClick={onClose}
          />

          {/* 채팅 모달 - 플로팅 버튼 공간 확보 */}
          <div
            className={`fixed z-[10001] gpu-accelerated chat-modal transition-all duration-300 ease-out ${
              isMinimized 
                ? 'bottom-24 right-4 translate-x-0 translate-y-0' 
                : 'bottom-4 xs:bottom-24 xs:left-auto xs:right-4 sm:right-6 left-2 right-2 xs:left-auto xs:right-4'
            }`}
          >
            <Card 
              className={`shadow-2xl border-0 overflow-hidden ${
                isMinimized 
                  ? "w-48 h-14 rounded-2xl" 
                  : "w-full h-[calc(100vh-4rem)] xs:w-[380px] xs:h-[546px] sm:w-[400px] sm:h-[588px] md:w-[440px] md:h-[672px] xs:max-w-none xs:rounded-2xl rounded-t-2xl xs:rounded-b-2xl"
              }`}
            >
              {/* 채팅 내용 - 모달 오픈 상태 전달 */}
              {!isMinimized && (
                <div className="h-full overflow-hidden">
                  <ChatTabs 
                    isModalOpen={isOpen} 
                    onMessageUpdate={onMessageUpdate}
                    onClose={onClose}
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