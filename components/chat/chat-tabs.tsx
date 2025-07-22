"use client"

import { useState } from "react"
import { Globe, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatRoom } from "./chat-room"

interface ChatTabsProps {
  isModalOpen?: boolean
  onMessageUpdate?: (messageId: number) => void
}

/**
 * 채팅 탭 컴포넌트
 * 글로벌, 문의 채팅 탭 관리
 */
export function ChatTabs({ isModalOpen = false, onMessageUpdate }: ChatTabsProps) {
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
        <TabsList 
          className="grid w-full grid-cols-2 bg-blue-600 h-16 rounded-t-2xl p-2 gap-1"
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