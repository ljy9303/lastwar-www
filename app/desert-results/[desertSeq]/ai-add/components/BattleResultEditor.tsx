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
  Plus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Target,
  Users,
  Crown,
  Medal
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

  const handleMvpEdit = useCallback((index: number, field: string, value: string | number) => {
    const updatedData = { ...data }
    const updatedMvpList = [...updatedData.mvpList]
    
    if (field === 'category') {
      updatedMvpList[index].category = String(value)
    } else if (field === 'nickname') {
      updatedMvpList[index].nickname = String(value)
      updatedMvpList[index].originalNickname = String(value) // 원본도 동일하게 설정
    } else if (field === 'score') {
      updatedMvpList[index].score = Number(value) || 0
    }
    
    updatedData.mvpList = updatedMvpList
    onDataUpdate(updatedData)
  }, [data, onDataUpdate])

  const handleMvpAdd = useCallback(() => {
    const updatedData = { ...data }
    updatedData.mvpList = [
      ...updatedData.mvpList,
      {
        category: "새 카테고리",
        nickname: "닉네임",
        originalNickname: "닉네임",
        score: 0
      }
    ]
    onDataUpdate(updatedData)
  }, [data, onDataUpdate])

  const handleMvpRemove = useCallback((index: number) => {
    const updatedData = { ...data }
    updatedData.mvpList = updatedData.mvpList.filter((_, i) => i !== index)
    onDataUpdate(updatedData)
  }, [data, onDataUpdate])

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

          {/* MVP 정보 */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                MVP 정보
                <Badge variant="outline" className="ml-auto">
                  {data.mvpList.length}개
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.mvpList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Medal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>추출된 MVP 정보가 없습니다.</p>
                  <p className="text-sm">필요시 아래 버튼으로 수동 추가할 수 있습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.mvpList.map((mvp, index) => (
                    <Card key={index} className="border border-muted-foreground/20">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-sm">카테고리</Label>
                            <Input
                              value={mvp.category}
                              onChange={(e) => handleMvpEdit(index, 'category', e.target.value)}
                              placeholder="예: 총 피해량"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">닉네임</Label>
                            <Input
                              value={mvp.nickname}
                              onChange={(e) => handleMvpEdit(index, 'nickname', e.target.value)}
                              placeholder="플레이어 닉네임"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">수치</Label>
                            <Input
                              type="number"
                              value={mvp.score}
                              onChange={(e) => handleMvpEdit(index, 'score', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMvpRemove(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleMvpAdd}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  MVP 정보 추가
                </Button>
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