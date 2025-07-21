"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userGrade?: string
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
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
  const { toast } = useToast()

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "복사 완료",
        description: "메시지가 클립보드에 복사되었습니다.",
      })
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "메시지 복사 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

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
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: showActions ? 1 : 0, scale: showActions ? 1 : 0.8 }}
              className="flex gap-1"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={copyMessage}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </motion.div>
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
              {message.userName}
            </span>
            {message.userGrade && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                {message.userGrade}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: showActions ? 1 : 0, scale: showActions ? 1 : 0.8 }}
                className="flex gap-1"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMessage}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}