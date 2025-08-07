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
  RotateCcw,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertCircle,
  Search,
  Zap,
  Filter,
  Image as ImageIcon
} from "lucide-react"
import { ImageOverlay } from "@/components/ui/image-overlay"
import { useToast } from "@/hooks/use-toast"
import type { ValidatedPlayerInfo, ProcessedImage, DuplicateGroup } from "@/types/ai-user-types"

interface AIResultEditorProps {
  players: ValidatedPlayerInfo[]
  images: ProcessedImage[]
  onPlayersUpdate: (players: ValidatedPlayerInfo[]) => void
  onNext: () => void
  onBack: () => void
  selectedGrade: string
}

export function AIResultEditor({
  players,
  images,
  onPlayersUpdate,
  onNext,
  onBack,
  selectedGrade
}: AIResultEditorProps) {
  const { toast } = useToast()
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [imageOverlay, setImageOverlay] = useState<{
    isOpen: boolean
    src: string
    alt: string
  }>({ isOpen: false, src: '', alt: '' })

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

  // 이미지 뷰어 열기
  const openImageViewer = (imageIndex: number) => {
    const image = images[imageIndex]
    if (image) {
      setImageOverlay({
        isOpen: true,
        src: image.preview,
        alt: `이미지 ${imageIndex + 1}`
      })
    }
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30">
        <div className="ai-fade-in">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <CheckSquare className="h-8 w-8 text-orange-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full ai-pulse-glow" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              4단계: AI 결과 검증 및 편집
            </span>
          </CardTitle>
          <div className="space-y-2 mt-3">
            <p className="text-muted-foreground">
              AI가 인식한 연맹원 정보를 검토하고 필요시 수정해주세요. 정확성을 확인한 후 다음 단계로 진행하세요.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-orange-600">
                <Search className="h-4 w-4" />
                <span>검증 및 편집</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Shield className="h-4 w-4" />
                <span>중복 탐지</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Zap className="h-4 w-4" />
                <span>자동 수정</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        {/* 통계 대시보드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ai-slide-up">
          <div className="ai-hover-lift">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2 ai-gentle-wiggle">
                  <div className="p-2 bg-blue-500 text-white rounded-full">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 ai-scale-in" style={{animationDelay: '0.3s'}}>
                  {stats.total}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">총 인식 수</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="ai-hover-lift">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2 ai-gentle-bounce">
                  <div className="p-2 bg-green-500 text-white rounded-full">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600 ai-scale-in" style={{animationDelay: '0.4s'}}>
                  {stats.valid}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">유효 데이터</div>
                <div className="text-xs text-green-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}% 정확도
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="ai-hover-lift">
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2 ai-gentle-shake">
                  <div className="p-2 bg-red-500 text-white rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 ai-scale-in" style={{animationDelay: '0.5s'}}>
                  {stats.invalid}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">오류 데이터</div>
                {stats.invalid > 0 && (
                  <div className="text-xs text-red-500 mt-1">수정 필요</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="ai-hover-lift">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-orange-500 text-white rounded-full ai-gentle-wiggle">
                    <Copy className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600 ai-scale-in" style={{animationDelay: '0.6s'}}>
                  {duplicateGroups.length}
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">중복 그룹</div>
                {duplicateGroups.length > 0 && (
                  <div className="text-xs text-orange-500 mt-1 ai-gentle-bounce">처리 필요</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 중복 경고 */}
        {duplicateGroups.length > 0 && (
          <div className="ai-slide-up">
            <Alert className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
              <div className="ai-gentle-wiggle inline-block">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-orange-800 dark:text-orange-200">
                      <strong>{duplicateGroups.length}개의 중복된 닉네임</strong>이 발견되었습니다
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      각 그룹별로 처리 방법을 선택해주세요
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {duplicateGroups.map((group, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg shadow-sm ai-fade-in"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <Users className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground">{group.nickname}</span>
                            <div className="text-sm text-muted-foreground">
                              {group.players.length}개 중복 항목
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="ai-hover-scale">
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30"
                              onClick={() => handleDuplicateResolution(group, 'keep-first')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              합치기
                            </Button>
                          </div>
                          <div className="ai-hover-scale">
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700"
                              onClick={() => handleDuplicateResolution(group, 'remove-all')}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              모두 삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}


        {/* 플레이어 목록 테이블 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">인식된 연맹원 목록</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={resetAll} className="ai-hover-scale">
                <RotateCcw className="h-4 w-4 mr-1" />
                초기화
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden ai-slide-up">
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
                            <span className={player.isDuplicate ? "text-orange-600 font-medium" : ""}>{displayNickname}</span>
                            {player.isDuplicate && (
                              <div className="ai-gentle-wiggle inline-block">
                                <Copy className="h-3 w-3 text-orange-500" />
                              </div>
                            )}
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
                          onClick={() => openImageViewer(player.imageIndex)}
                          title="이미지 보기"
                          className="ai-hover-scale"
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
                            className="ai-hover-scale"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicatePlayer(index)}
                            title="복제"
                            className="ai-hover-scale"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePlayer(index)}
                            title="삭제"
                            className="text-red-600 hover:text-red-700 ai-hover-scale"
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
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700 ai-fade-in" style={{animationDelay: '0.8s'}}>
          <div className="ai-hover-scale">
            <Button 
              onClick={onBack} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="ai-gentle-sway">
                ←
              </div>
              이전 단계
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 통계 표시 */}
            <div className="flex items-center gap-3 text-sm ai-fade-in" style={{animationDelay: '0.9s'}}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  stats.valid > 0 ? 'bg-green-500 ai-pulse-glow' : 'bg-gray-300'
                }`}></div>
                <span className="text-muted-foreground">
                  유효한 데이터: <span className="font-bold text-green-600">{stats.valid}</span>/{stats.total}개
                </span>
              </div>
              
              {stats.invalid > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-sm">{stats.invalid}개 수정 필요</span>
                </div>
              )}
            </div>
            
            {/* 등록 버튼 */}
            <div className="ai-hover-scale">
              <Button 
                onClick={onNext} 
                disabled={stats.valid === 0}
                size="lg"
                className={`
                  min-w-[140px] transition-all duration-300 shadow-lg
                  ${
                    stats.valid === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 hover:shadow-xl'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {stats.valid > 0 ? (
                    <>
                      <div className="ai-pulse-glow">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      연맹원 등록
                      <div className="ai-gentle-sway">
                        →
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      데이터 없음
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* 이미지 뷰어 모달 */}
      <ImageOverlay
        src={imageOverlay.src}
        alt={imageOverlay.alt}
        isOpen={imageOverlay.isOpen}
        onClose={() => setImageOverlay({ isOpen: false, src: '', alt: '' })}
      />
    </Card>
  )
}