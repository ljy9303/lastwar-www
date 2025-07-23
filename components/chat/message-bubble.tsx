"use client"

import React, { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { getLabelDisplayName, getLabelStyle } from "@/lib/user-label-utils"

interface ChatMessage {
  messageId: number
  userSeq: number
  userName: string
  userTag?: string
  userLabel?: string
  serverTag?: number
  allianceName?: string
  content: string
  createdAt: string
  messageType: "TEXT" | "SYSTEM" | "JOIN" | "LEAVE"
  roomType?: "GLOBAL" | "INQUIRY"
  isMyMessage: boolean
  timeDisplay: string
}

interface MessageBubbleProps {
  message: ChatMessage
  isLastInGroup?: boolean // 같은 사용자의 연속 메시지 중 마지막인지 여부
  isFirstInGroup?: boolean // 같은 사용자의 연속 메시지 중 첫번째인지 여부
}

/**
 * 메시지 버블 컴포넌트
 * 카카오톡 스타일의 말풍선 UI - 이벤트 최적화
 */
const MessageBubble = memo(function MessageBubble({ message, isLastInGroup = true, isFirstInGroup = true }: MessageBubbleProps) {
  // showActions 상태 제거로 불필요한 리렌더링 방지

  // 시스템 메시지 (입장, 퇴장, 공지) - 애니메이션 제거로 성능 최대화
  if (message.messageType === "SYSTEM" || message.messageType === "JOIN" || message.messageType === "LEAVE") {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs max-w-xs text-center">
          {message.content}
        </div>
      </div>
    )
  }

  // 내 메시지 (오른쪽 정렬) - 부드러운 애니메이션
  if (message.isMyMessage) {
    return (
      <div className="flex justify-end gpu-accelerated message-bubble animate-in slide-in-from-right-2 duration-200">
        <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
          {/* 시간 및 액션 (연속 메시지의 마지막에만 표시) */}
          {isLastInGroup && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {message.timeDisplay}
              </span>
            </div>
          )}

          {/* 메시지 버블 */}
          <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl rounded-br-md shadow-sm will-change-transform">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 다른 사용자 메시지 (왼쪽 정렬) - 부드러운 애니메이션
  return (
    <div className="flex justify-start gpu-accelerated message-bubble animate-in slide-in-from-left-2 duration-200">
      <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
        {/* 사용자 아바타 (연속 메시지의 첫번째에만 표시) */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 flex-shrink-0 ${
          isFirstInGroup 
            ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
            : 'bg-transparent' // 연속 메시지에서는 투명하게
        }`}>
          {isFirstInGroup && message.userName.charAt(0)}
        </div>

        {/* 메시지 컨테이너 */}
        <div className="flex-1 min-w-0">
          {/* 사용자 정보 (연속 메시지의 첫번째에만 표시) */}
          {isFirstInGroup && (
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
              {message.userLabel && (() => {
                const labelDisplayName = getLabelDisplayName(message.userLabel)
                const labelStyle = getLabelStyle(message.userLabel)
                
                if (!labelDisplayName || !labelStyle) return null
                
                return (
                  <Badge 
                    variant="outline" 
                    className={`text-xs h-4 px-1 ${labelStyle.bgColor} ${labelStyle.textColor} ${labelStyle.borderColor}`}
                  >
                    {labelDisplayName}
                  </Badge>
                )
              })()}
            </div>
          )}

          {/* 메시지 버블과 시간 */}
          <div className="flex items-end gap-2">
            {/* 메시지 버블 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-2xl rounded-bl-md shadow-sm will-change-transform">
              <p className="text-sm whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                {message.content}
              </p>
            </div>

            {/* 시간 및 액션 (연속 메시지의 마지막에만 표시) */}
            {isLastInGroup && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {message.timeDisplay}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// displayName 설정 (React DevTools용)
MessageBubble.displayName = 'MessageBubble'

export { MessageBubble }