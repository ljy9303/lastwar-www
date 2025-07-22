"use client"

import { useState, useCallback } from "react"
import { Globe, Users, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChatRoom } from "./chat-room"

interface ChatTabsProps {
  unreadCounts: {
    global: number
    alliance: number
    inquiry: number
  }
  onUnreadChange: (counts: { global: number; alliance: number; inquiry: number }) => void
}

/**
 * 채팅 탭 컴포넌트
 * 글로벌, 연맹, 문의 채팅 탭 관리
 */
export function ChatTabs({ unreadCounts, onUnreadChange }: ChatTabsProps) {
  const [activeTab, setActiveTab] = useState("alliance")

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    
    // 탭 변경 시 해당 채팅방의 읽지 않은 메시지 수 초기화
    const newCounts = { ...unreadCounts }
    if (value === "global") newCounts.global = 0
    else if (value === "alliance") newCounts.alliance = 0
    else if (value === "inquiry") newCounts.inquiry = 0
    
    onUnreadChange(newCounts)
  }, [unreadCounts, onUnreadChange])

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        {/* 탭 목록 - 타이틀처럼 크고 둥근 형태 */}
        <TabsList className="grid w-full grid-cols-3 bg-blue-600 h-16 rounded-t-2xl p-2 gap-1">
          {/* 글로벌 채팅 탭 */}
          <TabsTrigger 
            value="global" 
            className="flex items-center gap-2 text-sm font-medium h-12 rounded-xl text-white/80 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md transition-all duration-200"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">글로벌</span>
            {unreadCounts.global > 0 && (
              <Badge variant="destructive" className="min-w-[1rem] h-4 text-xs ml-1">
                {unreadCounts.global > 99 ? "99+" : unreadCounts.global}
              </Badge>
            )}
          </TabsTrigger>

          {/* 연맹 채팅 탭 */}
          <TabsTrigger 
            value="alliance" 
            className="flex items-center gap-2 text-sm font-medium h-12 rounded-xl text-white/80 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">연맹</span>
            {unreadCounts.alliance > 0 && (
              <Badge variant="destructive" className="min-w-[1rem] h-4 text-xs ml-1">
                {unreadCounts.alliance > 99 ? "99+" : unreadCounts.alliance}
              </Badge>
            )}
          </TabsTrigger>

          {/* 문의 채팅 탭 */}
          <TabsTrigger 
            value="inquiry" 
            className="flex items-center gap-2 text-sm font-medium h-12 rounded-xl text-white/80 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-md transition-all duration-200"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">문의</span>
            {unreadCounts.inquiry > 0 && (
              <Badge variant="destructive" className="min-w-[1rem] h-4 text-xs ml-1">
                {unreadCounts.inquiry > 99 ? "99+" : unreadCounts.inquiry}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 탭 내용 */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="global" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ChatRoom 
              roomType="GLOBAL"
              title="글로벌 채팅"
              description="모든 사용자와 대화해보세요"
              color="purple"
            />
          </TabsContent>

          <TabsContent value="alliance" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ChatRoom 
              roomType="ALLIANCE"
              title="연맹 채팅"
              description="연맹원들과 소통하세요"
              color="green"
            />
          </TabsContent>

          <TabsContent value="inquiry" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
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