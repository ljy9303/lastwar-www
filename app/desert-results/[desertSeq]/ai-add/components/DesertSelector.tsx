"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  AlertCircle,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { Desert } from "@/types/ai-desert-types"

interface DesertSelectorProps {
  desertList: Desert[]
  selectedDesert: Desert | null
  onDesertSelect: (desert: Desert) => void
  onNext: () => void
  onBack: () => void
}

export function DesertSelector({ 
  desertList, 
  selectedDesert, 
  onDesertSelect, 
  onNext, 
  onBack 
}: DesertSelectorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'SCHEDULED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '완료'
      case 'ONGOING':
        return '진행중'
      case 'SCHEDULED':
        return '예정'
      default:
        return status
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'MM/dd HH:mm', { locale: ko })
    } catch {
      return dateString
    }
  }

  if (desertList.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">사막전 목록 로딩 중...</h3>
              <p className="text-muted-foreground">잠시만 기다려주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            사막전을 선택해주세요
          </CardTitle>
          <p className="text-center text-muted-foreground">
            데이터를 등록할 사막전을 선택하세요
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 사막전 목록이 없는 경우 */}
          {desertList.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                현재 등록할 수 있는 사막전이 없습니다. 관리자에게 문의하세요.
              </AlertDescription>
            </Alert>
          )}

          {/* 사막전 목록 */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {desertList.map((desert) => (
              <Card 
                key={desert.desertSeq}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedDesert?.desertSeq === desert.desertSeq
                    ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/50' 
                    : 'hover:ring-1 hover:ring-purple-300'
                }`}
                onClick={() => onDesertSelect(desert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
                        <Trophy className="h-5 w-5 text-purple-600" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{desert.title}</h3>
                          <Badge className={getStatusColor(desert.status)}>
                            {getStatusText(desert.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>시작: {formatDateTime(desert.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>종료: {formatDateTime(desert.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedDesert?.desertSeq === desert.desertSeq && (
                      <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 선택된 사막전 정보 */}
          {selectedDesert && (
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-foreground">
                      {selectedDesert.title} 선택됨
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xs text-muted-foreground">시작 시간</div>
                      <div className="font-medium">{formatDateTime(selectedDesert.startTime)}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      <div className="text-xs text-muted-foreground">종료 시간</div>
                      <div className="font-medium">{formatDateTime(selectedDesert.endTime)}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    선택한 사막전에 대한 데이터를 등록합니다. 
                    다음 단계에서 해당 사막전의 스크린샷을 업로드해주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            
            <Button 
              onClick={onNext}
              disabled={!selectedDesert}
              className={`flex items-center gap-2 ${
                selectedDesert 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                  : ''
              }`}
            >
              다음: 이미지 업로드
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}