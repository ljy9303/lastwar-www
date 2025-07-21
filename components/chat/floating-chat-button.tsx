"use client"

import { useState } from "react"
import { MessageCircle, X, Users, Globe, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChatModal } from "./chat-modal"

/**
 * 플로팅 채팅 버튼 컴포넌트
 * PandaRank 스타일의 우하단 고정 채팅 버튼
 */
export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({
    global: 0,
    alliance: 3,
    inquiry: 1
  })

  // 전체 읽지 않은 메시지 수
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* 플로팅 채팅 버튼 */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative">
          {/* 메인 채팅 버튼 */}
          <Button
            onClick={toggleChat}
            size="lg"
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 p-0"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* 읽지 않은 메시지 배지 */}
          <AnimatePresence>
            {totalUnread > 0 && !isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2"
              >
                <Badge 
                  variant="destructive" 
                  className="min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 채팅방 프리뷰 버튼들 (호버 시 표시) */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 0, scale: 0.8, y: 20 }}
                whileHover={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 right-0 flex flex-col gap-2 pointer-events-none group-hover:pointer-events-auto"
              >
                {/* 문의 채팅 프리뷰 */}
                {unreadCounts.inquiry > 0 && (
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-10 h-10 rounded-full shadow-md bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full text-xs"
                    >
                      {unreadCounts.inquiry}
                    </Badge>
                  </motion.div>
                )}

                {/* 연맹 채팅 프리뷰 */}
                {unreadCounts.alliance > 0 && (
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-10 h-10 rounded-full shadow-md bg-green-100 hover:bg-green-200 text-green-700 border border-green-200"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full text-xs"
                    >
                      {unreadCounts.alliance}
                    </Badge>
                  </motion.div>
                )}

                {/* 글로벌 채팅 프리뷰 */}
                {unreadCounts.global > 0 && (
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-10 h-10 rounded-full shadow-md bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full text-xs"
                    >
                      {unreadCounts.global}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 채팅 모달 */}
      <ChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        unreadCounts={unreadCounts}
        onUnreadChange={setUnreadCounts}
      />
    </>
  )
}