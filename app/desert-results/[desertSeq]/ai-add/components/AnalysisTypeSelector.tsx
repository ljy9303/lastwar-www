"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Target,
  BarChart3,
  UserCheck
} from "lucide-react"
import type { DesertAnalysisType } from "@/types/ai-desert-types"

interface AnalysisTypeSelectorProps {
  selectedType: DesertAnalysisType | null
  onTypeSelect: (type: DesertAnalysisType) => void
  onNext: () => void
  onBack: () => void
}

export function AnalysisTypeSelector({ 
  selectedType, 
  onTypeSelect, 
  onNext, 
  onBack 
}: AnalysisTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            분석 유형을 선택해주세요
          </CardTitle>
          <p className="text-center text-muted-foreground">
            업로드할 스크린샷의 종류에 따라 분석 방식이 달라집니다
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 사막전 결과 분석 */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === 'EVENT' 
                  ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/50' 
                  : 'hover:ring-1 hover:ring-orange-300'
              }`}
              onClick={() => onTypeSelect('EVENT')}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
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
                  {selectedType === 'EVENT' && (
                    <CheckCircle2 className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  사막전 종료 후 결과 화면의 스크린샷을 분석하여 점수, 승부결과, MVP 정보를 추출합니다.
                </p>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">추출 정보:</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>우리팀/상대팀 서버명, 연맹명, 점수</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>승부 결과 및 점수 차이</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>MVP 정보 (카테고리별 1위)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                  <div className="text-xs text-muted-foreground">
                    💡 <strong>추천:</strong> 사막전 종료 직후 결과 요약 화면을 캡처하세요
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 참석여부 분석 */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === 'ATTENDANCE' 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/50' 
                  : 'hover:ring-1 hover:ring-blue-300'
              }`}
              onClick={() => onTypeSelect('ATTENDANCE')}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
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
                  {selectedType === 'ATTENDANCE' && (
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  사막전 참가자 목록 화면의 스크린샷을 분석하여 연맹원별 참석현황과 기여도를 추출합니다.
                </p>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">추출 정보:</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>연맹원별 참석/미참석 현황</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>개별 점수 및 기여도</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>연맹원 자동 매칭 및 참석률 통계</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-muted-foreground">
                    💡 <strong>추천:</strong> 연맹원 목록이 모두 보이는 화면을 캡처하세요
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 선택된 타입에 대한 상세 안내 */}
          {selectedType && (
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    {selectedType === 'EVENT' ? (
                      <Trophy className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="font-semibold text-foreground">
                      {selectedType === 'EVENT' ? '사막전 결과 분석' : '참석여부 분석'} 모드 선택됨
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {selectedType === 'EVENT' 
                      ? '다음 단계에서 결과를 등록할 사막전을 선택하고, 결과 화면 스크린샷을 업로드하세요. AI가 자동으로 점수와 MVP 정보를 추출합니다.'
                      : '다음 단계에서 참석여부를 등록할 사막전을 선택하고, 참가자 목록 스크린샷을 업로드하세요. AI가 자동으로 연맹원을 매칭하고 참석현황을 추출합니다.'
                    }
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
              disabled={!selectedType}
              className={`flex items-center gap-2 ${
                selectedType 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                  : ''
              }`}
            >
              다음: 사막전 선택
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}