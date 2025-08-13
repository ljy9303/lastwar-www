"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users,
  Edit3,
  Check,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UserCheck,
  UserX,
  BarChart3,
  Search
} from "lucide-react"
import type { DesertAttendanceData, Desert } from "@/types/ai-desert-types"

interface AttendanceEditorProps {
  data: DesertAttendanceData
  onDataUpdate: (data: DesertAttendanceData) => void
  onNext: () => void
  onBack: () => void
  selectedDesert: Desert
}

export function AttendanceEditor({ 
  data, 
  onDataUpdate, 
  onNext, 
  onBack, 
  selectedDesert 
}: AttendanceEditorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [tempValues, setTempValues] = useState<{
    nickname: string
    score: number
    attendance: boolean
  }>({ nickname: "", score: 0, attendance: false })

  const handleRowEdit = useCallback((index: number) => {
    const item = data.attendanceList[index]
    setEditingRow(index)
    setTempValues({
      nickname: item.nickname,
      score: item.score,
      attendance: item.attendance
    })
  }, [data.attendanceList])

  const handleRowSave = useCallback((index: number) => {
    const updatedData = { ...data }
    const updatedList = [...updatedData.attendanceList]
    
    updatedList[index] = {
      ...updatedList[index],
      nickname: tempValues.nickname,
      originalNickname: tempValues.nickname, // 원본도 동일하게 설정
      score: tempValues.score,
      attendance: tempValues.attendance
    }
    
    // 참석률 재계산
    const attendedCount = updatedList.filter(item => item.attendance).length
    const totalCount = updatedList.length
    
    updatedData.attendanceList = updatedList
    updatedData.summary = {
      totalPlayers: totalCount,
      attendedPlayers: attendedCount,
      attendanceRate: totalCount > 0 ? (attendedCount / totalCount) * 100 : 0
    }
    
    onDataUpdate(updatedData)
    setEditingRow(null)
    setTempValues({ nickname: "", score: 0, attendance: false })
  }, [data, tempValues, onDataUpdate])

  const handleRowCancel = useCallback(() => {
    setEditingRow(null)
    setTempValues({ nickname: "", score: 0, attendance: false })
  }, [])

  const handleRowDelete = useCallback((index: number) => {
    const updatedData = { ...data }
    const updatedList = updatedData.attendanceList.filter((_, i) => i !== index)
    
    // 참석률 재계산
    const attendedCount = updatedList.filter(item => item.attendance).length
    const totalCount = updatedList.length
    
    updatedData.attendanceList = updatedList
    updatedData.summary = {
      totalPlayers: totalCount,
      attendedPlayers: attendedCount,
      attendanceRate: totalCount > 0 ? (attendedCount / totalCount) * 100 : 0
    }
    
    onDataUpdate(updatedData)
  }, [data, onDataUpdate])

  const handleAddNew = useCallback(() => {
    const updatedData = { ...data }
    const newItem = {
      nickname: "새 플레이어",
      originalNickname: "새 플레이어",
      attendance: true,
      score: 0
    }
    
    updatedData.attendanceList = [...updatedData.attendanceList, newItem]
    
    // 참석률 재계산
    const attendedCount = updatedData.attendanceList.filter(item => item.attendance).length
    const totalCount = updatedData.attendanceList.length
    
    updatedData.summary = {
      totalPlayers: totalCount,
      attendedPlayers: attendedCount,
      attendanceRate: totalCount > 0 ? (attendedCount / totalCount) * 100 : 0
    }
    
    onDataUpdate(updatedData)
  }, [data, onDataUpdate])

  const filteredAttendanceList = data.attendanceList.filter(item =>
    item.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalNickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isDataValid = () => {
    return data.attendanceList.length > 0 && 
           data.attendanceList.every(item => item.nickname.trim().length > 0)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            참석여부 정보 확인 및 수정
          </CardTitle>
          <p className="text-center text-muted-foreground">
            AI가 추출한 참석여부 정보를 검토하고 필요시 수정하세요
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 선택된 사막전 정보 */}
          <Alert className="border-blue-200 dark:border-blue-800">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="font-medium">등록 대상 사막전: {selectedDesert.title}</div>
            </AlertDescription>
          </Alert>

          {/* 요약 통계 */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                참석 현황 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                  <div className="text-2xl font-bold text-blue-600">{data.summary.totalPlayers}</div>
                  <div className="text-sm text-muted-foreground">총 인원</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/50">
                  <div className="text-2xl font-bold text-green-600">{data.summary.attendedPlayers}</div>
                  <div className="text-sm text-muted-foreground">참석 인원</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/50">
                  <div className="text-2xl font-bold text-red-600">{data.summary.totalPlayers - data.summary.attendedPlayers}</div>
                  <div className="text-sm text-muted-foreground">미참석 인원</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                  <div className="text-2xl font-bold text-purple-600">{data.summary.attendanceRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">참석률</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 검색 및 추가 */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAddNew}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              플레이어 추가
            </Button>
          </div>

          {/* 참석여부 목록 */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                참석여부 목록
                <Badge variant="outline" className="ml-auto">
                  {filteredAttendanceList.length}명 {searchTerm && `(${data.attendanceList.length}명 중)`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAttendanceList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchTerm 
                      ? "검색 결과가 없습니다." 
                      : "추출된 참석여부 정보가 없습니다."
                    }
                  </p>
                  {!searchTerm && (
                    <p className="text-sm">필요시 위의 버튼으로 수동 추가할 수 있습니다.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAttendanceList.map((item, index) => {
                    // 원본 배열에서의 실제 인덱스 찾기
                    const originalIndex = data.attendanceList.findIndex(original => 
                      original.nickname === item.nickname && 
                      original.originalNickname === item.originalNickname &&
                      original.score === item.score
                    )
                    
                    const isEditing = editingRow === originalIndex

                    return (
                      <Card key={originalIndex} className="border border-muted-foreground/20">
                        <CardContent className="p-4">
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                              <div className="space-y-2">
                                <Label className="text-sm">닉네임</Label>
                                <Input
                                  value={tempValues.nickname}
                                  onChange={(e) => setTempValues(prev => ({ ...prev, nickname: e.target.value }))}
                                  placeholder="플레이어 닉네임"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">점수</Label>
                                <Input
                                  type="number"
                                  value={tempValues.score}
                                  onChange={(e) => setTempValues(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">참석여부</Label>
                                <div className="flex items-center space-x-2 h-10">
                                  <Checkbox
                                    checked={tempValues.attendance}
                                    onCheckedChange={(checked) => setTempValues(prev => ({ ...prev, attendance: checked as boolean }))}
                                  />
                                  <span className="text-sm">
                                    {tempValues.attendance ? '참석' : '미참석'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleRowSave(originalIndex)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleRowCancel}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* 참석 여부 아이콘 */}
                                <div className="flex-shrink-0">
                                  {item.attendance ? (
                                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                      <UserCheck className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : (
                                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                                      <UserX className="h-4 w-4 text-red-600" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* 플레이어 정보 */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{item.nickname}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={item.attendance 
                                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" 
                                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                      }
                                    >
                                      {item.attendance ? '참석' : '미참석'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    점수: {item.score.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* 액션 버튼 */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRowEdit(originalIndex)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRowDelete(originalIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 유효성 검사 결과 */}
          {!isDataValid() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                올바르지 않은 데이터가 있습니다. 모든 플레이어의 닉네임이 입력되었는지 확인해주세요.
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
              다음: 참석여부 저장
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}