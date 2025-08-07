"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bot,
  Sparkles,
  Upload,
  Search,
  CheckSquare,
  UserPlus,
  Shield,
  Camera,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Lightbulb
} from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const steps = [
    {
      icon: Shield,
      title: "등급 선택",
      description: "연맹원 등급 지정",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: Upload,
      title: "스크린샷 업로드",
      description: "연맹원 목록 이미지",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      icon: Search,
      title: "AI 자동 분석",
      description: "정보 자동 추출",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      icon: CheckSquare,
      title: "검증 및 수정",
      description: "데이터 확인 및 편집",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      icon: UserPlus,
      title: "일괄 등록",
      description: "연맹원 자동 등록",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
    }
  ]

  const features = [
    {
      icon: Bot,
      title: "AI 자동 인식",
      description: "Gemini AI가 스크린샷에서 닉네임, 레벨, 전투력을 자동으로 추출합니다",
      color: "text-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30"
    },
    {
      icon: Zap,
      title: "대량 처리",
      description: "한 번에 최대 50명까지 처리 가능하며, 여러 이미지를 동시에 업로드할 수 있습니다",
      color: "text-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30"
    },
    {
      icon: CheckCircle,
      title: "정확성 보장",
      description: "AI가 추출한 정보를 검토하고 수정할 수 있어 100% 정확한 데이터를 보장합니다",
      color: "text-green-600",
      bgGradient: "from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30"
    }
  ]

  const tips = [
    {
      icon: Camera,
      title: "선명한 스크린샷",
      description: "텍스트가 명확하게 보이는 고화질 이미지를 사용하세요",
      important: true
    },
    {
      icon: Users,
      title: "전체 정보 포함",
      description: "닉네임, 레벨, 전투력이 모두 보이는 화면을 캡처하세요",
      important: true
    },
    {
      icon: Clock,
      title: "처리 시간",
      description: "이미지당 약 30초 정도 소요됩니다 (이미지 품질에 따라 차이)",
      important: false
    },
    {
      icon: Lightbulb,
      title: "최적 조건",
      description: "어두운 배경에 밝은 텍스트가 가장 정확하게 인식됩니다",
      important: false
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* 메인 환영 섹션 */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* 환영 메시지 */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">AI 기반 자동화</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                <span className="block mb-2">환영합니다! 🎉</span>
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI 연맹원 등록을 시작하겠습니다
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                스크린샷 하나로 여러 연맹원을 한 번에 등록할 수 있습니다. 
                <br className="hidden sm:block" />
                <span className="font-semibold text-foreground">간단한 5단계</span>만 거치면 완료됩니다.
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                시작하기
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>약 3-5분 소요</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 과정 안내 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                5단계 간단 과정
              </h3>
              <p className="text-muted-foreground">
                직관적인 단계별 가이드를 따라 쉽게 완료하세요
              </p>
            </div>

            {/* 단계 플로우 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-lg hover:bg-accent/50 transition-colors duration-200">
                    <div className={`relative p-3 rounded-full ${step.bgColor} ring-2 ring-white dark:ring-gray-800 shadow-sm`}>
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* 연결선 (데스크톱에서만) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-2 w-4 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주요 기능 소개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className={`w-full p-4 rounded-lg bg-gradient-to-br ${feature.bgGradient} mb-4`}>
                <feature.icon className={`h-8 w-8 ${feature.color} mx-auto`} />
              </div>
              
              <div className="space-y-2 text-center">
                <h4 className="font-bold text-foreground">{feature.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 준비사항 및 팁 */}
      <Card className="border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/30 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
                시작하기 전 확인사항
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/30">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    tip.important 
                      ? 'bg-amber-100 dark:bg-amber-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <tip.icon className={`h-4 w-4 ${
                      tip.important 
                        ? 'text-amber-600' 
                        : 'text-blue-600'
                    }`} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">
                        {tip.title}
                      </h4>
                      {tip.important && (
                        <Badge variant="secondary" className="text-xs px-2 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                          중요
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-1 rounded-full bg-blue-500">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    ✨ 지원 형식: PNG, JPG • 최대 크기: 10MB • 이미지당 최대 50명 인식
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                    게임 내 연맹원 목록, 스코어보드, 랭킹 화면 등 모든 형태의 스크린샷을 지원합니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최종 시작 버튼 */}
      <div className="text-center pt-4">
        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-14 px-12 text-lg font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-700 hover:via-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <Bot className="mr-3 h-6 w-6" />
          AI 연맹원 등록 시작하기
          <ArrowRight className="ml-3 h-6 w-6" />
        </Button>
        
        <p className="mt-3 text-sm text-muted-foreground">
          준비가 되셨다면 버튼을 클릭하여 시작하세요! 
        </p>
      </div>
    </div>
  )
}