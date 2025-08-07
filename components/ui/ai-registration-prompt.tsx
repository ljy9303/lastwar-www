"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Sparkles, ArrowRight, Users, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AIRegistrationPromptProps {
  className?: string
}

export function AIRegistrationPrompt({ className }: AIRegistrationPromptProps) {
  return (
    <Card className={cn(
      "overflow-hidden border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 relative group animate-pulse-slow",
      className
    )}>
      {/* 배경 애니메이션 요소들 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-indigo-400/10 animate-gradient-x" />
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-300" />
      
      <CardContent className="relative p-8 text-center">
        {/* 주요 아이콘과 애니메이션 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* 메인 아이콘 */}
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-10 w-10 text-white animate-bounce-slow" />
            </div>
            
            {/* 회전하는 장식 링 */}
            <div className="absolute -inset-3 border-2 border-blue-400/30 rounded-full animate-spin-slow" />
            <div className="absolute -inset-6 border border-purple-400/20 rounded-full animate-spin-reverse-slow" />
            
            {/* 반짝이는 효과 */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-ping">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>

        {/* 타이틀과 설명 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-text">
              🚀 연맹원이 없습니다!
            </span>
          </h2>
          
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              <strong className="text-blue-600 dark:text-blue-400">AI 자동 등록</strong>으로 빠르게 연맹원을 추가해보세요
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                <span>자동 인식</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-green-500" />
                <span>일괄 등록</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse delay-150" />
                <span>AI 분석</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="space-y-4">
          <Button 
            asChild
            size="lg"
            className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 animate-pulse-glow group"
          >
            <Link href="/users/ai-add">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 group-hover:animate-bounce" />
                <span>AI 연맹원 등록 시작하기</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </Button>
          
          <div className="text-xs text-muted-foreground">
            💡 스크린샷만 업로드하면 AI가 자동으로 연맹원 정보를 추출합니다
          </div>
        </div>

        {/* 추가 행동 옵션 */}
        <div className="mt-6 pt-6 border-t border-blue-200/50 dark:border-blue-800/50">
          <p className="text-sm text-muted-foreground mb-3">또는</p>
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/30"
          >
            <Link href="/users">
              <Users className="h-4 w-4 mr-2" />
              수동으로 연맹원 추가
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 커스텀 CSS 애니메이션을 위한 스타일
export const aiRegistrationPromptStyles = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes gradient-text {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes spin-reverse-slow {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4); }
  }
  
  .animate-gradient-x {
    background-size: 400% 400%;
    animation: gradient-x 6s ease infinite;
  }
  
  .animate-gradient-text {
    background-size: 400% 400%;
    animation: gradient-text 4s ease infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }
  
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
  
  .animate-spin-reverse-slow {
    animation: spin-reverse-slow 10s linear infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`