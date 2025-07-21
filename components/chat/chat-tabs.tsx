"use client"

import { useState } from "react"
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // 탭 변경 시 해당 채팅방의 읽지 않은 메시지 수 초기화
    const newCounts = { ...unreadCounts }
    if (value === "global") newCounts.global = 0
    else if (value === "alliance") newCounts.alliance = 0
    else if (value === "inquiry") newCounts.inquiry = 0
    
    onUnreadChange(newCounts)
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        {/* 탭 목록 */}
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          {/* 글로벌 채팅 탭 */}
          <TabsTrigger 
            value="global" 
            className="flex items-center gap-1 text-xs data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            <Globe className="h-3 w-3" />
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
            className="flex items-center gap-1 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            <Users className="h-3 w-3" />
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
            className="flex items-center gap-1 text-xs data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
          >
            <HelpCircle className="h-3 w-3" />
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
            <ChatRoom 
              roomType="INQUIRY"
              title="문의하기"
              description="관리자에게 문의사항을 남겨주세요"
              color="orange"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}