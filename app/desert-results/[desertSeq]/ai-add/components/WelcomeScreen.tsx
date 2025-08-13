"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy,
  Users,
  Bot,
  Sparkles,
  ArrowRight,
  Camera,
  Clock,
  CheckCircle2
} from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="space-y-8">
      {/* 주요 기능 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 사막전 결과 분석 */}
        <Card className="relative overflow-hidden border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 ring-1 ring-orange-500/20">
                <Trophy className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">사막전 결과 분석</h3>
                <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                  EVENT 모드
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              사막전 종료 후 결과 스크린샷을 업로드하면 AI가 자동으로 분석합니다.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>우리팀/상대팀 서버, 연맹명, 점수</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>승부 결과 및 점수 차이</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>MVP 정보 (카테고리별 1위 플레이어)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 참석여부 분석 */}
        <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-blue-500/20">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">참석여부 분석</h3>
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  ATTENDANCE 모드
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              사막전 참가자 목록 스크린샷을 업로드하면 참석여부를 자동 추적합니다.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>연맹원별 참석/미참석 현황</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>개별 점수 및 기여도</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>연맹원 자동 매칭 및 참석률 통계</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 작업 흐름 안내 */}
      <Card className="border-2 border-dashed border-muted-foreground/20">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">간단한 4단계 과정</h3>
              <p className="text-muted-foreground">
                몇 번의 클릭만으로 사막전 데이터를 자동으로 기록하세요
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1단계 */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-b from-purple-50 to-transparent dark:from-purple-950/50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-foreground">분석 유형 선택</div>
                  <div className="text-sm text-muted-foreground">결과 or 참석여부</div>
                </div>
              </div>

              {/* 2단계 */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-foreground">사막전 선택</div>
                  <div className="text-sm text-muted-foreground">등록할 사막전</div>
                </div>
              </div>

              {/* 3단계 */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                  3
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-foreground">이미지 업로드</div>
                  <div className="text-sm text-muted-foreground">스크린샷 첨부</div>
                </div>
              </div>

              {/* 4단계 */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-950/50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                  4
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-foreground">자동 등록</div>
                  <div className="text-sm text-muted-foreground">AI 분석 & 저장</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 기능 하이라이트 */}
      <Card className="bg-gradient-to-r from-violet-50 via-purple-50 to-blue-50 dark:from-violet-950/50 dark:via-purple-950/50 dark:to-blue-950/50 border border-violet-200 dark:border-violet-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 ring-1 ring-violet-500/20">
                  <Bot className="h-12 w-12 text-violet-600" />
                </div>
                <div className="absolute -top-2 -right-2 animate-bounce">
                  <div className="p-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500">
                    <Sparkles className="h-4 w-4 text-yellow-100" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                    AI 정밀 분석 기술
                  </span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Google Gemini 2.0 Flash 모델을 사용하여 사막전 스크린샷에서 
                  정확한 데이터를 추출하고 자동으로 연맹원과 매칭합니다.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 ring-1 ring-violet-200/50 dark:ring-violet-800/50">
                  <Camera className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium">OCR 텍스트 인식</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 ring-1 ring-blue-200/50 dark:ring-blue-800/50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">1-2분 고속 처리</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 ring-1 ring-green-200/50 dark:ring-green-800/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">99% 정확도</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 시작 버튼 */}
      <div className="flex justify-center">
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg"
        >
          <Bot className="h-5 w-5 mr-2" />
          AI 사막전 등록 시작하기
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}