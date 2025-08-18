"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react"
import type { DesertAnalysisType, DesertTeamGroup } from "@/types/ai-desert-types"

interface AnalysisTypeSelectorProps {
  selectedType: DesertAnalysisType | null
  selectedTeamGroup: DesertTeamGroup | null
  onTypeSelect: (type: DesertAnalysisType) => void
  onTeamGroupSelect: (group: DesertTeamGroup) => void
  onNext: () => void
  onBack: () => void
}

export function AnalysisTypeSelector({ 
  selectedType, 
  selectedTeamGroup,
  onTypeSelect, 
  onTeamGroupSelect,
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 사막전 결과 분석 */}
            <Card 
              className={`cursor-pointer transition-all duration-300 ${
                selectedType === 'EVENT' 
                  ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/50' 
                  : 'hover:ring-1 hover:ring-orange-300'
              }`}
              onClick={() => onTypeSelect('EVENT')}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900 w-fit mx-auto">
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold">사막전 결과</h3>
                <p className="text-sm text-muted-foreground">승부 결과, 점수, 서버/연맹 정보</p>
                {selectedType === 'EVENT' && (
                  <CheckCircle2 className="h-5 w-5 text-orange-600 mx-auto" />
                )}
              </CardContent>
            </Card>

            {/* 참석여부 분석 */}
            <Card 
              className={`cursor-pointer transition-all duration-300 ${
                selectedType === 'ATTENDANCE' 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/50' 
                  : 'hover:ring-1 hover:ring-blue-300'
              }`}
              onClick={() => onTypeSelect('ATTENDANCE')}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900 w-fit mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">참석여부</h3>
                <p className="text-sm text-muted-foreground">연맹원 참석 현황 및 점수</p>
                {selectedType === 'ATTENDANCE' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mx-auto" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 조 선택 */}
          {selectedType && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">우리 연맹이 속한 조를 선택해주세요</h3>
              <div className="flex justify-center gap-4">
                <Button
                  variant={selectedTeamGroup === 'A' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => onTeamGroupSelect('A')}
                  className={`w-24 h-16 text-lg font-bold ${
                    selectedTeamGroup === 'A' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                  }`}
                >
                  A조
                </Button>
                <Button
                  variant={selectedTeamGroup === 'B' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => onTeamGroupSelect('B')}
                  className={`w-24 h-16 text-lg font-bold ${
                    selectedTeamGroup === 'B' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  B조
                </Button>
              </div>
              {selectedTeamGroup && (
                <div className="text-center">
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${
                    selectedTeamGroup === 'A' ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'
                  }`}>
                    {selectedTeamGroup}조 선택됨
                  </Badge>
                </div>
              )}
            </div>
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
              disabled={!selectedType || !selectedTeamGroup}
              className={`flex items-center gap-2 ${
                selectedType && selectedTeamGroup
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