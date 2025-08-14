"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy,
  Users,
  Bot,
  ArrowRight
} from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="space-y-6">
      {/* 간단한 제목 */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-foreground">AI 사막전 데이터 등록</h2>
        <p className="text-muted-foreground">스크린샷을 업로드하면 AI가 자동으로 데이터를 추출합니다</p>
      </div>

      {/* 분석 유형 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900 w-fit mx-auto">
              <Trophy className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold">사막전 결과</h3>
            <p className="text-sm text-muted-foreground">승부 결과, 점수, 서버/연맹 정보</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <CardContent className="p-6 text-center space-y-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900 w-fit mx-auto">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold">참석여부</h3>
            <p className="text-sm text-muted-foreground">연맹원 참석 현황 및 점수</p>
          </CardContent>
        </Card>
      </div>

      {/* 시작 버튼 */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
        >
          <Bot className="h-5 w-5 mr-2" />
          시작하기
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}