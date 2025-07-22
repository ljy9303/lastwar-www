"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userTag?: string
  serverTag?: number
  allianceName?: string
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  roomType?: "GLOBAL" | "ALLIANCE" | "INQUIRY"
  isMyMessage: boolean
  timeDisplay: string
}

interface MessageBubbleProps {
  message: ChatMessage
}

/**
 * 메시지 버블 컴포넌트
 * 카카오톡 스타일의 말풍선 UI
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  // 시스템 메시지 (입장, 퇴장, 공지)
  if (message.messageType === "SYSTEM" || message.messageType === "JOIN" || message.messageType === "LEAVE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs max-w-xs text-center">
          {message.content}
        </div>
      </motion.div>
    )
  }

  // 내 메시지 (오른쪽 정렬)
  if (message.isMyMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-end gap-2 max-w-xs">
          {/* 시간 및 액션 */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {message.timeDisplay}
            </span>
          </div>

          {/* 메시지 버블 */}
          <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl rounded-br-md shadow-sm">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // 다른 사용자 메시지 (왼쪽 정렬)
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-start group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2 max-w-xs">
        {/* 사용자 아바타 */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 flex-shrink-0">
          {message.userName.charAt(0)}
        </div>

        {/* 메시지 컨테이너 */}
        <div className="flex-1 min-w-0">
          {/* 사용자 정보 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {message.roomType === "GLOBAL" && message.serverTag && message.allianceName ? (
                <>
                  <span className="text-xs text-gray-500">#{message.serverTag}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 mx-1">[{message.allianceName}]</span>
                  <span>{message.userName}</span>
                </>
              ) : (
                message.userName
              )}
            </span>
            {message.userTag && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                {message.userTag}
              </Badge>
            )}
          </div>

          {/* 메시지 버블과 시간 */}
          <div className="flex items-end gap-2">
            {/* 메시지 버블 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-2xl rounded-bl-md shadow-sm">
              <p className="text-sm whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                {message.content}
              </p>
            </div>

            {/* 시간 및 액션 */}
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {message.timeDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}