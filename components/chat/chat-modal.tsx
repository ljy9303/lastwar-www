"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChatTabs } from "./chat-tabs"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  unreadCounts: {
    global: number
    alliance: number
    inquiry: number
  }
  onUnreadChange: (counts: { global: number; alliance: number; inquiry: number }) => void
}

/**
 * 채팅 모달 컴포넌트
 * 카카오톡 스타일의 채팅 인터페이스
 */
export function ChatModal({ isOpen, onClose, unreadCounts, onUnreadChange }: ChatModalProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 모바일 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] md:hidden"
            onClick={onClose}
          />

          {/* 채팅 모달 */}
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              x: "100%",
              y: "100%" 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: isMinimized ? "calc(100% - 200px)" : 0,
              y: isMinimized ? "calc(100% - 60px)" : 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              x: "100%",
              y: "100%" 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed bottom-24 right-6 z-[10001]"
          >
            <Card className={`shadow-2xl border-0 overflow-hidden rounded-2xl ${
              isMinimized 
                ? "w-48 h-14" 
                : "w-[380px] h-[520px] sm:w-[400px] sm:h-[560px] md:w-[440px] md:h-[640px]"
            }`}>
              {/* 채팅 내용 - 타이틀 영역 제거, 탭이 헤더 역할 */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-hidden"
                  >
                    <ChatTabs 
                      unreadCounts={unreadCounts}
                      onUnreadChange={onUnreadChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}