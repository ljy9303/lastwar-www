"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle,
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Target
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { DesertRegistrationResult, DesertAnalysisType, Desert } from "@/types/ai-desert-types"

interface RegistrationCompleteScreenProps {
  result: DesertRegistrationResult
  analysisType: DesertAnalysisType
  selectedDesert: Desert
  onStartNew: () => void
}

export function RegistrationCompleteScreen({ 
  result, 
  analysisType, 
  selectedDesert, 
  onStartNew 
}: RegistrationCompleteScreenProps) {
  const router = useRouter()

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    } catch {
      return dateString
    }
  }

  const getAnalysisTypeInfo = () => {
    return analysisType === 'EVENT' 
      ? {
          icon: Trophy,
          title: "사막전 결과 등록 완료",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-950/50",
          description: "사막전 결과가 성공적으로 저장되었습니다"
        }
      : {
          icon: Users,
          title: "참석여부 등록 완료", 
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/50",
          description: "참석여부가 성공적으로 저장되었습니다"
        }
  }

  const typeInfo = getAnalysisTypeInfo()
  const TypeIcon = typeInfo.icon

  return (
    <div className="space-y-8">
      {/* 성공 메시지 */}
      <Card className={`border-2 border-green-200 dark:border-green-800 ${typeInfo.bgColor}`}>
        <CardContent className="p-8 text-center space-y-6">
          {/* 성공 아이콘 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
              </div>
            </div>
          </div>
          
          {/* 메인 메시지 */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              🎉 {typeInfo.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {typeInfo.description}
            </p>
            
            {result.message && (
              <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border">
                <p className="text-sm font-medium text-foreground">
                  {result.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 등록된 사막전 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            등록된 사막전 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">사막전 제목</div>
              <div className="font-semibold text-foreground">{selectedDesert.title}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">등록 유형</div>
              <Badge className={analysisType === 'EVENT' 
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }>
                {analysisType === 'EVENT' ? '사막전 결과' : '참석여부'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">시작 시간</div>
              <div className="font-medium text-foreground">{formatDateTime(selectedDesert.startTime)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">종료 시간</div>
              <div className="font-medium text-foreground">{formatDateTime(selectedDesert.endTime)}</div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">등록 완료 시간</div>
            <div className="font-medium text-foreground">{formatDateTime(new Date().toISOString())}</div>
          </div>
        </CardContent>
      </Card>

      {/* 다음 단계 안내 */}
      <Card className="border-2 border-dashed border-muted-foreground/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">다음에 할 수 있는 작업</h3>
              <p className="text-muted-foreground">
                등록이 완료되었습니다. 이제 다른 작업을 진행하거나 결과를 확인해보세요.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 사막전 결과 보기 */}
              <div className="p-4 rounded-lg bg-gradient-to-b from-purple-50 to-transparent dark:from-purple-950/50 border border-purple-200 dark:border-purple-800">
                <div className="space-y-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 w-fit mx-auto">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">결과 확인</div>
                    <div className="text-sm text-muted-foreground">등록된 데이터 보기</div>
                  </div>
                </div>
              </div>

              {/* 새로운 등록 */}
              <div className="p-4 rounded-lg bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/50 border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 w-fit mx-auto">
                    <RefreshCw className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">새로운 등록</div>
                    <div className="text-sm text-muted-foreground">다른 사막전 등록</div>
                  </div>
                </div>
              </div>

              {/* 다른 기능 */}
              <div className="p-4 rounded-lg bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/50 border border-blue-200 dark:border-blue-800">
                <div className="space-y-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 w-fit mx-auto">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">다른 기능</div>
                    <div className="text-sm text-muted-foreground">다른 관리 메뉴</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => router.push('/desert-results')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          사막전 결과 보기
          <ExternalLink className="h-4 w-4" />
        </Button>
        
        <Button 
          onClick={onStartNew}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          새로운 AI 등록 시작
        </Button>
        
        <Button 
          onClick={() => router.push('/')}
          variant="ghost"
          className="flex items-center gap-2"
        >
          메인 대시보드로
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 추가 정보 */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          🤖 이 데이터는 AI가 자동으로 분석하여 등록되었습니다.
        </p>
        <p>
          문제가 있거나 수정이 필요한 경우 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  )
}