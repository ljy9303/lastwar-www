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
  Lightbulb,
  RefreshCw,
  Star,
  Info
} from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-6">


        {/* 시작 버튼 */}
        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-700 hover:via-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <Bot className="mr-4 h-7 w-7" />
          AI 연맹원 등록 시작하기
          <ArrowRight className="ml-4 h-7 w-7" />
        </Button>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          스크린샷으로 여러 연맹원을 한 번에 등록하세요
        </p>
      </div>
    </div>
  )
}