"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy,
  Edit3,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Target,
  Users,
  Shield
} from "lucide-react"
import type { DesertBattleResult, Desert } from "@/types/ai-desert-types"

interface BattleResultEditorProps {
  data: DesertBattleResult
  onDataUpdate: (data: DesertBattleResult) => void
  onNext: () => void
  onBack: () => void
  selectedDesert: Desert
}

export function BattleResultEditor({ 
  data, 
  onDataUpdate, 
  onNext, 
  onBack, 
  selectedDesert 
}: BattleResultEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>("")

  const handleFieldEdit = useCallback((field: string, currentValue: string | number) => {
    setEditingField(field)
    setTempValue(String(currentValue))
  }, [])

  const handleFieldSave = useCallback((field: string) => {
    const updatedData = { ...data }
    
    switch (field) {
      case 'ourServer':
        updatedData.ourServer = tempValue
        break
      case 'ourAllianceName':
        updatedData.ourAllianceName = tempValue
        break
      case 'ourScore':
        updatedData.ourScore = parseInt(tempValue) || 0
        break
      case 'enemyServer':
        updatedData.enemyServer = tempValue
        break
      case 'enemyAllianceName':
        updatedData.enemyAllianceName = tempValue
        break
      case 'enemyScore':
        updatedData.enemyScore = parseInt(tempValue) || 0
        break
      case 'battleResult':
        updatedData.battleResult = tempValue as 'WIN' | 'LOSE'
        break
      case 'teamGroup':
        updatedData.teamGroup = tempValue as 'A' | 'B'
        break
    }

    // 점수 차이 자동 계산
    updatedData.scoreDifference = Math.abs(updatedData.ourScore - updatedData.enemyScore)

    onDataUpdate(updatedData)
    setEditingField(null)
    setTempValue("")
  }, [data, tempValue, onDataUpdate])

  const handleFieldCancel = useCallback(() => {
    setEditingField(null)
    setTempValue("")
  }, [])

  // MVP 관련 함수들 제거 - 보안상 개인 성과 정보 노출 방지

  const getBattleResultColor = (result: string) => {
    switch (result) {
      case 'WIN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'LOSE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getBattleResultText = (result: string) => {
    switch (result) {
      case 'WIN':
        return '승리'
      case 'LOSE':
        return '패배'
      default:
        return result
    }
  }

  const renderEditableField = (
    field: string,
    label: string,
    value: string | number,
    type: 'text' | 'number' | 'select' = 'text',
    selectOptions?: Array<{ value: string; label: string }>
  ) => {
    const isEditing = editingField === field

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {isEditing ? (
          <div className="flex items-center gap-2">
            {type === 'select' && selectOptions ? (
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="flex-1"
                autoFocus
              />
            )}
            <Button size="sm" onClick={() => handleFieldSave(field)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <div className="flex-1 p-2 rounded border bg-muted/30">
              {field === 'battleResult' ? (
                <Badge className={getBattleResultColor(String(value))}>
                  {getBattleResultText(String(value))}
                </Badge>
              ) : field === 'teamGroup' ? (
                <Badge className={`${
                  value === 'A' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {value}조
                </Badge>
              ) : (
                <span className="font-medium">{value}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFieldEdit(field, value)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  const isDataValid = () => {
    return (
      data.ourServer?.length > 0 &&
      data.ourAllianceName?.length > 0 &&
      data.enemyServer?.length > 0 &&
      data.enemyAllianceName?.length > 0 &&
      data.ourScore >= 0 &&
      data.enemyScore >= 0 &&
      ['WIN', 'LOSE'].includes(data.battleResult) &&
      ['A', 'B'].includes(data.teamGroup)
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-orange-600" />
            사막전 결과 정보 확인 및 수정
          </CardTitle>
          <p className="text-center text-muted-foreground">
            AI가 추출한 정보를 검토하고 필요시 수정하세요
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 선택된 사막전 정보 */}
          <Alert className="border-purple-200 dark:border-purple-800">
            <Trophy className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              <div className="font-medium">등록 대상 사막전: {selectedDesert.title}</div>
            </AlertDescription>
          </Alert>

          {/* 핵심 결과 정보 - 크고 명확하게 */}
          <div className="space-y-6">
            {/* 소속 조 & 승부 결과 - 가장 중요한 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 소속 조 */}
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <Label className="text-sm text-blue-700 dark:text-blue-300 font-medium">우리 연맹 소속 조</Label>
                      <div className="mt-2">
                        {editingField === 'teamGroup' ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              variant={tempValue === 'A' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => setTempValue('A')}
                              className={`px-8 py-4 text-xl font-bold ${
                                tempValue === 'A' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              A조
                            </Button>
                            <Button
                              variant={tempValue === 'B' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => setTempValue('B')}
                              className={`px-8 py-4 text-xl font-bold ${
                                tempValue === 'B' 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              B조
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => handleFieldEdit('teamGroup', data.teamGroup)}
                            className={`px-8 py-4 text-2xl font-black ${
                              data.teamGroup === 'A' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {data.teamGroup}조
                          </Button>
                        )}
                        {editingField === 'teamGroup' && (
                          <div className="flex justify-center gap-2 mt-3">
                            <Button size="sm" onClick={() => handleFieldSave('teamGroup')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 승부 결과 */}
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Trophy className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <Label className="text-sm text-orange-700 dark:text-orange-300 font-medium">사막전 결과</Label>
                      <div className="mt-2">
                        {editingField === 'battleResult' ? (
                          <div className="flex justify-center gap-3">
                            <Button
                              variant={tempValue === 'WIN' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => setTempValue('WIN')}
                              className={`px-8 py-4 text-xl font-bold ${
                                tempValue === 'WIN' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'hover:bg-green-50 hover:text-green-600'
                              }`}
                            >
                              승리
                            </Button>
                            <Button
                              variant={tempValue === 'LOSE' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => setTempValue('LOSE')}
                              className={`px-8 py-4 text-xl font-bold ${
                                tempValue === 'LOSE' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              패배
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => handleFieldEdit('battleResult', data.battleResult)}
                            className={`px-8 py-4 text-2xl font-black ${getBattleResultColor(data.battleResult)} border-0`}
                          >
                            {getBattleResultText(data.battleResult)}
                          </Button>
                        )}
                        {editingField === 'battleResult' && (
                          <div className="flex justify-center gap-2 mt-3">
                            <Button size="sm" onClick={() => handleFieldSave('battleResult')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 점수 정보 - 큰 카드로 표시 */}
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <Label className="text-lg text-green-700 dark:text-green-300 font-bold">점수 현황</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* 우리 점수 */}
                    <div className="text-center space-y-2">
                      <Label className="text-sm text-blue-600 font-medium">우리팀 점수</Label>
                      {editingField === 'ourScore' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="text-center text-2xl font-bold h-14 w-32"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleFieldSave('ourScore')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => handleFieldEdit('ourScore', data.ourScore)}
                          className="text-3xl font-black text-blue-600 hover:bg-blue-50 h-14 px-6"
                        >
                          {data.ourScore.toLocaleString()}
                        </Button>
                      )}
                    </div>

                    {/* 점수 차이 */}
                    <div className="text-center space-y-2">
                      <Label className="text-sm text-green-600 font-medium">점수 차이</Label>
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-black text-green-600 bg-green-100 dark:bg-green-900 rounded-lg px-4 py-2">
                          {data.scoreDifference.toLocaleString()}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">(자동 계산)</span>
                      </div>
                    </div>

                    {/* 상대 점수 */}
                    <div className="text-center space-y-2">
                      <Label className="text-sm text-red-600 font-medium">상대팀 점수</Label>
                      {editingField === 'enemyScore' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="text-center text-2xl font-bold h-14 w-32"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleFieldSave('enemyScore')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => handleFieldEdit('enemyScore', data.enemyScore)}
                          className="text-3xl font-black text-red-600 hover:bg-red-50 h-14 px-6"
                        >
                          {data.enemyScore.toLocaleString()}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 팀 정보 - 간소화된 버전 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 우리팀 정보 */}
              <Card className="border border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    우리팀 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderEditableField('ourServer', '서버명', data.ourServer)}
                  {renderEditableField('ourAllianceName', '연맹명', data.ourAllianceName)}
                </CardContent>
              </Card>

              {/* 상대팀 정보 */}
              <Card className="border border-red-200 dark:border-red-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-600" />
                    상대팀 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderEditableField('enemyServer', '서버명', data.enemyServer)}
                  {renderEditableField('enemyAllianceName', '연맹명', data.enemyAllianceName)}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MVP 정보 섹션 제거 - 보안상 개인 성과 정보 노출 방지 */}


          {/* 유효성 검사 결과 */}
          {!isDataValid() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                필수 정보가 누락되었습니다. 모든 기본 정보를 올바르게 입력해주세요.
              </AlertDescription>
            </Alert>
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
              disabled={!isDataValid()}
              className={`flex items-center gap-2 ${
                isDataValid()
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                  : ''
              }`}
            >
              다음: 결과 저장
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}