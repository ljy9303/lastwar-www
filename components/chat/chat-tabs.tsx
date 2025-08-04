"use client"

import { useState } from "react"
import { Globe, HelpCircle, X, Minimize2 } from "lucide-react"
import { OptimizedTouchButton } from "@/components/ui/optimized-touch-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatRoom } from "./chat-room"

interface MobileKeyboardState {
  isVisible: boolean
  height: number
  viewportHeight: number
  screenHeight: number
  isTransitioning: boolean
}

interface ChatTabsProps {
  isModalOpen?: boolean
  onMessageUpdate?: (messageId: number) => void
  onClose?: () => void
  keyboardState?: MobileKeyboardState
}

/**
 * 채팅 탭 컴포넌트
 * 글로벌, 문의 채팅 탭 관리
 */
export function ChatTabs({ isModalOpen = false, onMessageUpdate, onClose, keyboardState }: ChatTabsProps) {
  const [activeTab, setActiveTab] = useState("global")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div 
      className="flex flex-col h-full"
      style={{
        contain: 'layout style', // CSS containment로 성능 향상
        willChange: 'contents'
      }}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        {/* 탭 목록 - 타이틀처럼 크고 둥근 형태 */}
        <div className="relative bg-blue-600 rounded-t-2xl">
          {/* 모바일 닫기 버튼 */}
          {onClose && (
            <OptimizedTouchButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 h-8 w-8 p-0 text-white hover:bg-blue-700 xs:hidden"
              enableHaptics={true}
              enableRipple={true}
              minTouchTarget={true}
              aria-label="채팅창 닫기"
            >
              <X className="h-4 w-4" />
            </OptimizedTouchButton>
          )}
          
          <TabsList 
            className="grid w-full grid-cols-2 bg-transparent h-16 p-2 gap-1"
            style={{
              contain: 'layout style paint',
              transform: 'translateZ(0)' // GPU 가속
            }}
          >
          {/* 글로벌 채팅 탭 */}
          <TabsTrigger 
            value="global" 
            className="flex items-center gap-2 text-sm font-medium h-12 rounded-xl text-white/80 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md transition-all duration-150 ease-out"
            style={{
              willChange: 'background-color, color, box-shadow',
              backfaceVisibility: 'hidden'
            }}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">글로벌</span>
          </TabsTrigger>

          {/* 문의 채팅 탭 */}
          <TabsTrigger 
            value="inquiry" 
            className="flex items-center gap-2 text-sm font-medium h-12 rounded-xl text-white/80 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-md transition-all duration-150 ease-out"
            style={{
              willChange: 'background-color, color, box-shadow',
              backfaceVisibility: 'hidden'
            }}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">문의</span>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* 탭 내용 - 성능 최적화 */}
        <div 
          className="flex-1 overflow-hidden"
          style={{
            contain: 'layout style paint size',
            isolation: 'isolate',
            transform: 'translateZ(0)'
          }}
        >
          <TabsContent 
            value="global" 
            className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            style={{
              contain: 'layout style',
              willChange: 'opacity'
            }}
          >
            <ChatRoom 
              roomType="GLOBAL"
              title="글로벌 채팅"
              description="모든 사용자와 대화해보세요"
              color="purple"
              isModalOpen={isModalOpen}
              onMessageUpdate={onMessageUpdate}
              keyboardState={keyboardState}
            />
          </TabsContent>

          <TabsContent 
            value="inquiry" 
            className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            style={{
              contain: 'layout style',
              willChange: 'opacity'
            }}
          >
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-orange-100 dark:bg-orange-900/20 rounded-xl p-6 max-w-xs">
                <HelpCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  문의 채팅
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300 mb-4">
                  관리자 문의 기능을 준비 중입니다
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-medium">
                  🚧 오픈 준비중
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}