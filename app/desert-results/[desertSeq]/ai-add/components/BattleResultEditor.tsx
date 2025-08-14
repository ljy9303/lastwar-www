"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
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
  Settings,
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
        updatedData.battleResult = tempValue as 'WIN' | 'LOSE' | 'DRAW'
        break
      case 'battleServerNumber':
        updatedData.battleServerNumber = parseInt(tempValue) || undefined
        break
      case 'battleUnion':
        updatedData.battleUnion = tempValue || undefined
        break
      case 'battleUnionAlias':
        updatedData.battleUnionAlias = tempValue || undefined
        break
      case 'battleUnionRank':
        updatedData.battleUnionRank = parseInt(tempValue) || undefined
        break
      case 'description':
        updatedData.description = tempValue || undefined
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
      case 'DRAW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
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
      case 'DRAW':
        return '무승부'
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
      ['WIN', 'LOSE', 'DRAW'].includes(data.battleResult)
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

          {/* 기본 결과 정보 */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                기본 결과 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 우리팀 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  우리팀 정보
                </h3>
                <div className="space-y-4">
                  {renderEditableField('ourServer', '서버명', data.ourServer)}
                  {renderEditableField('ourAllianceName', '연맹명', data.ourAllianceName)}
                  {renderEditableField('ourScore', '점수', data.ourScore, 'number')}
                </div>
              </div>

              {/* 상대팀 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-600" />
                  상대팀 정보
                </h3>
                <div className="space-y-4">
                  {renderEditableField('enemyServer', '서버명', data.enemyServer)}
                  {renderEditableField('enemyAllianceName', '연맹명', data.enemyAllianceName)}
                  {renderEditableField('enemyScore', '점수', data.enemyScore, 'number')}
                </div>
              </div>

              {/* 승부 결과 */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {renderEditableField('battleResult', '승부 결과', data.battleResult, 'select', [
                    { value: 'WIN', label: '승리' },
                    { value: 'LOSE', label: '패배' },
                    { value: 'DRAW', label: '무승부' }
                  ])}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">점수 차이</Label>
                  <div className="p-2 rounded border bg-muted/30">
                    <span className="font-medium">{data.scoreDifference}</span>
                    <span className="text-sm text-muted-foreground ml-2">(자동 계산)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MVP 정보 섹션 제거 - 보안상 개인 성과 정보 노출 방지 */}

          {/* 추가 옵션 정보 */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                추가 옵션 정보
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                상대팀 정보와 추가 세부사항을 입력하세요 (선택사항)
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 상대팀 세부 정보 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  {renderEditableField('battleServerNumber', '상대 서버 번호', data.battleServerNumber || '', 'number')}
                </div>
                <div>
                  {renderEditableField('battleUnion', '상대 연맹명', data.battleUnion || '')}
                </div>
                <div>
                  {renderEditableField('battleUnionAlias', '연맹 태그', data.battleUnionAlias || '')}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  {renderEditableField('battleUnionRank', '상대 연맹 순위', data.battleUnionRank || '', 'number')}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">전투 비고</Label>
                  {editingField === 'description' ? (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder="특이사항이나 추가 정보를 입력하세요..."
                        className="flex-1 min-h-[80px] resize-none"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" onClick={() => handleFieldSave('description')}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 group">
                      <div className="flex-1 p-3 rounded border bg-muted/30 min-h-[80px]">
                        <span className="text-sm text-muted-foreground">
                          {data.description || '비고 정보가 없습니다.'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFieldEdit('description', data.description || '')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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