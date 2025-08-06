"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  Check,
  X,
  Edit3,
  Users,
  Copy,
  Trash2,
  Eye,
  RotateCcw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ValidatedPlayerInfo, ProcessedImage, DuplicateGroup } from "@/types/ai-user-types"

interface OCRResultEditorProps {
  players: ValidatedPlayerInfo[]
  images: ProcessedImage[]
  onPlayersUpdate: (players: ValidatedPlayerInfo[]) => void
  onNext: () => void
  onBack: () => void
  selectedGrade: string
}

export function OCRResultEditor({
  players,
  images,
  onPlayersUpdate,
  onNext,
  onBack,
  selectedGrade
}: OCRResultEditorProps) {
  const { toast } = useToast()
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // 중복 그룹 계산
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, ValidatedPlayerInfo[]> = {}
    
    players.forEach(player => {
      const key = player.nickname.toLowerCase().trim()
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(player)
    })

    return Object.entries(groups)
      .filter(([_, playerList]) => playerList.length > 1)
      .map(([nickname, playerList]): DuplicateGroup => ({
        nickname,
        players: playerList,
        action: 'keep-first'
      }))
  }, [players])

  // 통계 계산
  const stats = useMemo(() => {
    const total = players.length
    const valid = players.filter(p => p.isValid).length
    const invalid = total - valid
    const duplicates = duplicateGroups.reduce((acc, group) => acc + group.players.length, 0)

    return { total, valid, invalid, duplicates }
  }, [players, duplicateGroups])

  // 플레이어 정보 업데이트
  const updatePlayer = (index: number, updates: Partial<ValidatedPlayerInfo>) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], ...updates }
    
    // 유효성 검사 다시 실행
    updatedPlayers[index] = validatePlayer(updatedPlayers[index])
    
    onPlayersUpdate(updatedPlayers)
  }

  // 플레이어 삭제
  const removePlayer = (index: number) => {
    const updatedPlayers = players.filter((_, i) => i !== index)
    onPlayersUpdate(updatedPlayers)
    
    toast({
      title: "플레이어 삭제됨",
      description: "선택한 플레이어가 목록에서 제거되었습니다.",
    })
  }

  // 플레이어 복제
  const duplicatePlayer = (index: number) => {
    const player = players[index]
    const newPlayer = {
      ...player,
      nickname: `${player.nickname}_복사본`
    }
    
    const updatedPlayers = [...players]
    updatedPlayers.splice(index + 1, 0, validatePlayer(newPlayer))
    onPlayersUpdate(updatedPlayers)
    
    toast({
      title: "플레이어 복제됨",
      description: "플레이어가 복제되었습니다. 닉네임을 수정해주세요.",
    })
  }

  // 전투력 문자열 파싱
  const parsePowerString = (powerStr: string): number => {
    const cleanStr = powerStr.replace(/[^0-9.KMB]/g, '')
    const numberMatch = cleanStr.match(/([0-9.]+)([KMB]?)/)
    
    if (!numberMatch) return 0
    
    const value = parseFloat(numberMatch[1])
    const unit = numberMatch[2]
    
    switch (unit) {
      case 'K':
        return value * 0.001
      case 'M':
        return value
      case 'B':
        return value * 1000
      default:
        return value
    }
  }

  // 플레이어 유효성 검사
  const validatePlayer = (player: ValidatedPlayerInfo): ValidatedPlayerInfo => {
    const errors: string[] = []

    // 닉네임 검사
    if (!player.nickname || player.nickname.trim().length === 0) {
      errors.push("닉네임이 비어있습니다")
    } else if (player.nickname.length < 2) {
      errors.push("닉네임이 너무 짧습니다 (최소 2자)")
    } else if (player.nickname.length > 20) {
      errors.push("닉네임이 너무 깁니다 (최대 20자)")
    }

    // 레벨 검사
    if (player.level < 1 || player.level > 50) {
      errors.push("레벨이 유효하지 않습니다 (1-50)")
    }

    // 전투력 검사
    const powerValue = parsePowerString(player.power)
    if (powerValue <= 0) {
      errors.push("전투력이 유효하지 않습니다")
    }

    // 중복 검사
    const isDuplicate = players.some((p, i) => 
      p !== player && 
      p.nickname.toLowerCase().trim() === player.nickname.toLowerCase().trim()
    )

    return {
      ...player,
      isValid: errors.length === 0,
      errors,
      isDuplicate
    }
  }

  // 중복 처리
  const handleDuplicateResolution = (group: DuplicateGroup, action: 'keep-first' | 'keep-all' | 'remove-all') => {
    let updatedPlayers = [...players]

    if (action === 'keep-first') {
      // 첫 번째만 유지하고 나머지 삭제
      const toRemove = group.players.slice(1)
      updatedPlayers = players.filter(p => !toRemove.includes(p))
    } else if (action === 'remove-all') {
      // 모두 삭제
      updatedPlayers = players.filter(p => !group.players.includes(p))
    }
    // 'keep-all'인 경우 아무것도 하지 않음

    onPlayersUpdate(updatedPlayers)
  }

  // 편집 모드 토글
  const toggleEdit = (index: number) => {
    setEditingPlayerId(editingPlayerId === `${index}` ? null : `${index}`)
  }

  // 이미지 미리보기 토글
  const toggleImagePreview = (imageIndex: number) => {
    setSelectedImageIndex(selectedImageIndex === imageIndex ? null : imageIndex)
  }

  // 전체 초기화
  const resetAll = () => {
    const resetPlayers = players.map(player => ({
      ...player,
      editedNickname: undefined,
      editedPower: undefined,
      editedLevel: undefined
    }))
    onPlayersUpdate(resetPlayers)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          3단계: OCR 결과 확인 및 편집
        </CardTitle>
        <p className="text-muted-foreground">
          AI가 인식한 유저 정보를 확인하고 필요시 수정해주세요. 
          모든 정보가 정확한지 확인한 후 다음 단계로 진행하세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">총 인식 수</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <div className="text-sm text-muted-foreground">유효한 데이터</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-sm text-muted-foreground">오류 데이터</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{duplicateGroups.length}</div>
              <div className="text-sm text-muted-foreground">중복 그룹</div>
            </CardContent>
          </Card>
        </div>

        {/* 중복 경고 */}
        {duplicateGroups.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>{duplicateGroups.length}개의 중복된 닉네임</strong>이 발견되었습니다:</p>
                {duplicateGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                    <span className="font-medium">{group.nickname} ({group.players.length}개)</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateResolution(group, 'keep-first')}
                      >
                        첫 번째만 유지
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateResolution(group, 'remove-all')}
                      >
                        모두 삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 이미지 미리보기 (선택된 경우) */}
        {selectedImageIndex !== null && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">이미지 미리보기</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={images[selectedImageIndex]?.preview}
                alt={`이미지 ${selectedImageIndex + 1}`}
                className="max-w-full h-auto rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        {/* 플레이어 목록 테이블 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">인식된 유저 목록</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetAll}>
                <RotateCcw className="h-4 w-4 mr-1" />
                초기화
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>레벨</TableHead>
                  <TableHead>전투력</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>이미지</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-[120px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => {
                  const isEditing = editingPlayerId === `${index}`
                  const displayNickname = player.editedNickname || player.nickname
                  const displayLevel = player.editedLevel || player.level
                  const displayPower = player.editedPower || player.power

                  return (
                    <TableRow key={index} className={!player.isValid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={displayNickname}
                            onChange={(e) => updatePlayer(index, { editedNickname: e.target.value })}
                            className="w-full"
                            placeholder="닉네임 입력"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={player.isDuplicate ? "text-orange-600" : ""}>{displayNickname}</span>
                            {player.isDuplicate && <Copy className="h-3 w-3 text-orange-500" />}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={displayLevel}
                            onChange={(e) => updatePlayer(index, { editedLevel: parseInt(e.target.value) || 0 })}
                            className="w-full"
                            min="1"
                            max="50"
                          />
                        ) : (
                          <span>{displayLevel}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={displayPower}
                            onChange={(e) => updatePlayer(index, { editedPower: e.target.value })}
                            className="w-full"
                            placeholder="예: 30.5M"
                          />
                        ) : (
                          <span>{displayPower}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{selectedGrade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleImagePreview(player.imageIndex)}
                          title="이미지 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {player.isValid ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            유효
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            오류
                          </Badge>
                        )}
                        {player.errors.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {player.errors.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleEdit(index)}
                            title="편집"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicatePlayer(index)}
                            title="복제"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePlayer(index)}
                            title="삭제"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button onClick={onBack} variant="outline">
            이전 단계
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              유효한 데이터: {stats.valid}/{stats.total}개
            </span>
            
            <Button 
              onClick={onNext} 
              disabled={stats.valid === 0}
              className="min-w-[120px]"
            >
              유저 등록
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}