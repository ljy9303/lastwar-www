"use client"

import React, { memo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"  
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, EyeOff, Eye, Ban, UserX, Clock, Volume2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { getLabelDisplayName, getLabelStyle } from "@/lib/user-label-utils"
import { useIsAdmin } from "@/lib/auth-utils"
import { ChatAdminService, HideMessageRequest, RestrictUserRequest } from "@/lib/chat-service"
import { toast } from "@/hooks/use-toast"

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
  // ADMIN 기능 추가
  hiddenByAdmin?: boolean
  hiddenAt?: string
  hiddenByUserSeq?: number
  hiddenReason?: string
}

interface MessageBubbleProps {
  message: ChatMessage
  isLastInGroup?: boolean // 같은 사용자의 연속 메시지 중 마지막인지 여부
  isFirstInGroup?: boolean // 같은 사용자의 연속 메시지 중 첫번째인지 여부
  // 체크박스 선택 관련
  isSelectable?: boolean // 선택 가능한 상태인지 여부
  isSelected?: boolean // 현재 선택된 상태인지 여부
  onSelectionChange?: (messageId: number, selected: boolean) => void // 선택 상태 변경 콜백
  // 성능 최적화
  isVisible?: boolean // 뷰포트에 보이는지 여부 (가상화용)
}

/**
 * 메시지 버블 컴포넌트
 * 카카오톡 스타일의 말풍선 UI - 성능 최적화 적용
 */
const MessageBubble = memo(function MessageBubble({ 
  message, 
  isLastInGroup = true, 
  isFirstInGroup = true,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
  isVisible = true
}: MessageBubbleProps) {
  const isAdmin = useIsAdmin()
  const [isLoading, setIsLoading] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false) // 지연 렌더링 상태
  const [showUserMenu, setShowUserMenu] = useState(false) // 지연 렌더링 상태

  // 가상화: 보이지 않는 메시지는 최소한만 렌더링
  if (!isVisible) {
    return (
      <div className="h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
        <span className="text-xs text-gray-400">메시지 #{message.messageId}</span>
      </div>
    )
  }

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(message.messageId, checked)
    }
  }

  // ADMIN 사용자 제한 핸들러
  const handleRestrictUser = async (restrictionType: "READ_ONLY" | "MUTED" | "BANNED", durationMinutes?: number) => {
    if (!isAdmin) return
    
    setIsLoading(true)
    try {
      const request: RestrictUserRequest = {
        targetUserSeq: message.userSeq,
        roomType: message.roomType || "GLOBAL",
        restrictionType,
        reason: `관리자에 의한 ${restrictionType} 제한`,
        durationMinutes
      }
      
      const response = await ChatAdminService.restrictUser(request)
      
      if (response.success) {
        toast({
          title: "사용자 제한 적용 완료",
          description: `${message.userName}님에게 ${restrictionType} 제한이 적용되었습니다.`
        })
      } else {
        throw new Error(response.message || "사용자 제한 적용에 실패했습니다.")
      }
    } catch (error) {
      console.error('[ADMIN] 사용자 제한 오류:', error)
      toast({
        title: "사용자 제한 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnrestrictUser = async () => {
    if (!isAdmin) return
    
    setIsLoading(true)
    try {
      const response = await ChatAdminService.unrestrictUser({
        targetUserSeq: message.userSeq,
        roomType: message.roomType || "GLOBAL"
      })
      
      if (response.success) {
        toast({
          title: "사용자 제한 해제 완료",
          description: `${message.userName}님의 제한이 해제되었습니다.`
        })
      } else {
        throw new Error(response.message || "사용자 제한 해제에 실패했습니다.")
      }
    } catch (error) {
      console.error('[ADMIN] 사용자 제한 해제 오류:', error)
      toast({
        title: "사용자 제한 해제 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ADMIN 메시지 가리기/복원 핸들러
  const handleHideMessage = async (reason?: string) => {
    if (!isAdmin) return
    
    setIsLoading(true)
    try {
      const request: HideMessageRequest = {
        messageId: message.messageId,
        reason: reason || "관리자에 의해 가려진 메시지입니다."
      }
      
      const response = await ChatAdminService.hideMessage(request)
      
      if (response.success) {
        toast({
          title: "메시지 가리기 완료",
          description: "메시지가 성공적으로 가려졌습니다."
        })
        // 실시간 업데이트는 WebSocket을 통해 처리됨
      } else {
        throw new Error(response.message || "메시지 가리기에 실패했습니다.")
      }
    } catch (error) {
      console.error('[ADMIN] 메시지 가리기 오류:', error)
      toast({
        title: "메시지 가리기 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnhideMessage = async () => {
    if (!isAdmin) return
    
    setIsLoading(true)
    try {
      const response = await ChatAdminService.unhideMessage(message.messageId)
      
      if (response.success) {
        toast({
          title: "메시지 복원 완료",
          description: "메시지가 성공적으로 복원되었습니다."
        })
      } else {
        throw new Error(response.message || "메시지 복원에 실패했습니다.")
      }
    } catch (error) {
      console.error('[ADMIN] 메시지 복원 오류:', error)
      toast({
        title: "메시지 복원 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }


  // 체크박스 또는 ADMIN 관리 버튼 렌더링
  const renderAdminControls = () => {
    if (!isAdmin || message.messageType !== "TEXT") return null
    
    // 선택 가능 모드일 때는 체크박스 표시
    if (isSelectable) {
      return (
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="h-4 w-4"
          disabled={isLoading}
        />
      )
    }
    
    // 일반 모드일 때는 3-dot 버튼만 표시, 클릭 시 메뉴 지연 렌더링
    return (
      <DropdownMenu modal={false} onOpenChange={setShowAdminMenu}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 opacity-70 hover:opacity-100"
            disabled={isLoading}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        {/* 지연 렌더링: 드롭다운이 열릴 때만 메뉴 아이템들 렌더링 */}
        {showAdminMenu && (
          <DropdownMenuPortal>
            <DropdownMenuContent 
              align="end" 
              className="w-48 dropdown-menu-content" 
              sideOffset={5}
              style={{ zIndex: 10002 }}
            >
            {/* 메시지 가리기/복원 */}
            {message.hiddenByAdmin ? (
              <DropdownMenuItem onClick={handleUnhideMessage} disabled={isLoading}>
                <Eye className="mr-2 h-4 w-4" />
                메시지 복원
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleHideMessage()} disabled={isLoading}>
                <EyeOff className="mr-2 h-4 w-4" />
                메시지 가리기
              </DropdownMenuItem>
            )}
            
            </DropdownMenuContent>
          </DropdownMenuPortal>
        )}
      </DropdownMenu>
    )
  }

  // 사용자 프로필 클릭 시 ADMIN 사용자 관리 드롭다운 렌더링
  const renderUserProfileDropdown = () => {
    if (!isAdmin || message.messageType !== "TEXT" || message.isMyMessage) return null
    
    return (
      <DropdownMenu modal={false} onOpenChange={setShowUserMenu}>
        <DropdownMenuTrigger asChild>
          <button 
            className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors"
            disabled={isLoading}
          >
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
          </button>
        </DropdownMenuTrigger>
        {/* 지연 렌더링: 드롭다운이 열릴 때만 무거운 메뉴 아이템들 렌더링 */}
        {showUserMenu && (
          <DropdownMenuPortal>
            <DropdownMenuContent 
              align="start" 
              className="w-48 dropdown-menu-content" 
              sideOffset={5}
              style={{ zIndex: 10002 }}
            >
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b">
                사용자 관리
              </div>
              
              {/* 읽기 전용 (1시간) */}
              <DropdownMenuItem 
                onClick={() => handleRestrictUser("READ_ONLY", 60)} 
                disabled={isLoading}
              >
                <Clock className="mr-2 h-4 w-4" />
                읽기 전용 (1시간)
              </DropdownMenuItem>
              
              {/* 음소거 (1시간) */}
              <DropdownMenuItem 
                onClick={() => handleRestrictUser("MUTED", 60)} 
                disabled={isLoading}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                음소거 (1시간)
              </DropdownMenuItem>
              
              {/* 채팅 차단 (영구) */}
              <DropdownMenuItem 
                onClick={() => handleRestrictUser("BANNED")} 
                disabled={isLoading}
                className="text-red-600 dark:text-red-400"
              >
                <Ban className="mr-2 h-4 w-4" />
                채팅 차단 (영구)
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* 제한 해제 */}
              <DropdownMenuItem 
                onClick={handleUnrestrictUser} 
                disabled={isLoading}
                className="text-green-600 dark:text-green-400"
              >
                <UserX className="mr-2 h-4 w-4" />
                제한 해제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        )}
      </DropdownMenu>
    )
  }

  // 시스템 메시지 (입장, 퇴장, 공지) - 애니메이션 제거로 성능 최대화
  if (message.messageType === "SYSTEM" || message.messageType === "JOIN" || message.messageType === "LEAVE") {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 xs:px-3 py-1 rounded-full text-xs max-w-[90%] xs:max-w-xs text-center">
          {message.content}
        </div>
      </div>
    )
  }

  // 내 메시지 (오른쪽 정렬) - 부드러운 애니메이션
  if (message.isMyMessage) {
    return (
      <div className="flex justify-end gpu-accelerated message-bubble animate-in slide-in-from-right-2 duration-200">
        <div className="flex items-end gap-1.5 xs:gap-2 max-w-[85%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
          {/* 시간 및 액션 - 선택 모드일 때는 항상 표시, 일반 모드일 때는 마지막에만 표시 */}
          {(isSelectable || isLastInGroup) && (
            <div className="flex items-center gap-1 mb-1">
              {/* 시간은 마지막 그룹에만 표시 */}
              {isLastInGroup && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {message.timeDisplay}
                </span>
              )}
              {renderAdminControls()}
            </div>
          )}

          {/* 메시지 버블 */}
          <div className="bg-blue-500 text-white px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-2xl rounded-br-md shadow-sm will-change-transform max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden">
            {message.hiddenByAdmin ? (
              <p className="text-xs xs:text-sm italic text-blue-100">
                <span className="hidden xs:inline">관리자가 해당 메시지를 가렸습니다.</span>
                <span className="xs:hidden">메시지가 가려짐</span>
              </p>
            ) : (
              <p className="text-xs xs:text-sm whitespace-pre-wrap force-break-word max-w-full min-w-0 break-all">
                {message.content}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 다른 사용자 메시지 (왼쪽 정렬) - 부드러운 애니메이션
  return (
    <div className="flex justify-start gpu-accelerated message-bubble animate-in slide-in-from-left-2 duration-200">
      <div className="flex items-start gap-1.5 xs:gap-2 max-w-[85%] xs:max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
        {/* 사용자 아바타 (연속 메시지의 첫번째에만 표시) */}
        <div className={`w-7 h-7 xs:w-8 xs:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-1 flex-shrink-0 ${
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
            <div className="flex items-center gap-1 xs:gap-2 mb-1 overflow-hidden">
              {/* ADMIN이면 사용자 프로필 드롭다운, 아니면 일반 텍스트 */}
              {isAdmin && !message.isMyMessage ? (
                renderUserProfileDropdown()
              ) : (
                <span className="text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {message.roomType === "GLOBAL" && message.serverTag && message.allianceName ? (
                    <>
                      <span className="text-xs text-gray-500 hidden xs:inline">#{message.serverTag}</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 mx-1 hidden xs:inline">[{message.allianceName}]</span>
                      <span>{message.userName}</span>
                    </>
                  ) : (
                    message.userName
                  )}
                </span>
              )}
              {message.userTag && (
                <Badge variant="outline" className="text-xs h-3 xs:h-4 px-1 hidden xs:inline-flex">
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
                    className={`text-xs h-3 xs:h-4 px-1 hidden xs:inline-flex ${labelStyle.bgColor} ${labelStyle.textColor} ${labelStyle.borderColor}`}
                  >
                    {labelDisplayName}
                  </Badge>
                )
              })()}
            </div>
          )}

          {/* 메시지 버블과 시간 */}
          <div className="flex items-end gap-1.5 xs:gap-2">
            {/* 메시지 버블 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-2xl rounded-bl-md shadow-sm will-change-transform max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden">
              {message.hiddenByAdmin ? (
                <p className="text-xs xs:text-sm italic text-gray-500 dark:text-gray-400">
                  <span className="hidden xs:inline">관리자가 해당 메시지를 가렸습니다.</span>
                  <span className="xs:hidden">메시지가 가려짐</span>
                </p>
              ) : (
                <p className="text-xs xs:text-sm whitespace-pre-wrap force-break-word max-w-full min-w-0 break-all text-gray-800 dark:text-gray-200">
                  {message.content}
                </p>
              )}
            </div>

            {/* 시간 및 액션 - 선택 모드일 때는 항상 표시, 일반 모드일 때는 마지막에만 표시 */}
            {(isSelectable || isLastInGroup) && (
              <div className="flex items-center gap-1 mb-1">
                {/* 시간은 마지막 그룹에만 표시 */}
                {isLastInGroup && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {message.timeDisplay}
                  </span>
                )}
                {renderAdminControls()}
              </div>  
            )}
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // ADMIN 계정의 경우 더 세밀한 메모화 비교
  const isAdmin = nextProps.isSelectable !== undefined
  
  if (isAdmin) {
    return (
      prevProps.message.messageId === nextProps.message.messageId &&
      prevProps.isLastInGroup === nextProps.isLastInGroup &&
      prevProps.isFirstInGroup === nextProps.isFirstInGroup &&
      prevProps.isSelectable === nextProps.isSelectable &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.message.hiddenByAdmin === nextProps.message.hiddenByAdmin &&
      prevProps.message.content === nextProps.message.content
    )
  }
  
  // 일반 사용자는 기본 비교
  return (
    prevProps.message.messageId === nextProps.message.messageId &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.hiddenByAdmin === nextProps.message.hiddenByAdmin &&
    prevProps.isLastInGroup === nextProps.isLastInGroup &&
    prevProps.isFirstInGroup === nextProps.isFirstInGroup
  )
})

// displayName 설정 (React DevTools용)
MessageBubble.displayName = 'MessageBubble'

export { MessageBubble }