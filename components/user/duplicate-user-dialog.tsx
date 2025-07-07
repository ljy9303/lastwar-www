"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Users, UserCheck, UserPlus } from "lucide-react"

interface DuplicateUser {
  userSeq: number
  currentNickname: string
  previousNicknames?: string[]
  level: number
  power: number
  similarityScore: number
  matchReason: string
  userGrade: string
  lastActivity: string
  powerDifference?: number
  levelDifference?: number
}

interface DuplicateUserDialogProps {
  isOpen: boolean
  onClose: () => void
  duplicateUsers: DuplicateUser[]
  newUserData: {
    name: string
    level: number
    power: number
    userGrade: string
  }
  onSelectAction: (action: 'upsert' | 'create', selectedUserSeq?: number) => void
}

export function DuplicateUserDialog({ 
  isOpen, 
  onClose, 
  duplicateUsers, 
  newUserData,
  onSelectAction 
}: DuplicateUserDialogProps) {
  const [selectedUserSeq, setSelectedUserSeq] = useState<number | null>(null)
  
  // 정확히 일치하는 닉네임이 있는지 확인 (더 엄격한 조건)
  const hasExactMatch = duplicateUsers.some(user => {
    const isExactNickname = user.currentNickname.toLowerCase().trim() === newUserData.name.toLowerCase().trim()
    const isHighSimilarity = user.similarityScore >= 0.99 // 99% 이상 유사도
    const isExactMatch = user.matchReason && user.matchReason.includes("정확한 닉네임 일치")
    
    return isExactNickname || isHighSimilarity || isExactMatch
  })

  const formatPower = (power: number): string => {
    if (power === 0) return "0"
    if (power < 1) {
      return `${(power * 100).toFixed(0)}만`
    }
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)}B`
    }
    if (power >= 100) {
      return `${power.toFixed(0)}M`
    }
    return `${power.toFixed(1)}M`
  }

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.9) return "bg-red-100 text-red-800"
    if (score >= 0.7) return "bg-orange-100 text-orange-800"
    if (score >= 0.5) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const handleUpsert = () => {
    if (selectedUserSeq) {
      onSelectAction('upsert', selectedUserSeq)
      onClose()
    }
  }

  const handleCreateNew = () => {
    // 정확한 닉네임 일치가 있는 경우 생성 불가
    if (hasExactMatch) {
      console.warn("정확한 닉네임 일치로 인해 신규 생성이 불가능합니다:", newUserData.name)
      return
    }
    
    onSelectAction('create')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            중복 유저 발견
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 새로 추가하려는 유저 정보 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">
                추가하려는 유저 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">닉네임:</span> {newUserData.name}
                </div>
                <div>
                  <span className="font-medium">레벨:</span> {newUserData.level}
                </div>
                <div>
                  <span className="font-medium">전투력:</span> {formatPower(newUserData.power)}
                </div>
                <div>
                  <span className="font-medium">등급:</span> {newUserData.userGrade}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* 중복 가능성이 있는 유저들 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              중복 가능성이 있는 기존 유저들 ({duplicateUsers.length}명)
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {duplicateUsers.map((user) => (
                <Card 
                  key={user.userSeq} 
                  className={`cursor-pointer border-2 transition-colors ${
                    selectedUserSeq === user.userSeq 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUserSeq(user.userSeq)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.currentNickname}</span>
                        <Badge className={getSimilarityColor(user.similarityScore)}>
                          유사도 {(user.similarityScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Badge variant="outline">{user.userGrade}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                      <div>레벨: {user.level}</div>
                      <div>전투력: {formatPower(user.power)}</div>
                      <div>마지막 활동: {new Date(user.lastActivity).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="text-sm text-orange-600 mb-2">
                      매칭 이유: {user.matchReason}
                    </div>
                    
                    {user.powerDifference !== undefined && (
                      <div className="text-xs text-gray-500">
                        전투력 차이: {user.powerDifference.toFixed(1)}M
                      </div>
                    )}
                    
                    {user.levelDifference !== undefined && (
                      <div className="text-xs text-gray-500">
                        레벨 차이: {user.levelDifference}
                      </div>
                    )}
                    
                    {user.previousNicknames && user.previousNicknames.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        이전 닉네임: {user.previousNicknames.join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm mb-2 sm:mb-0">
            <div className="text-gray-600 mb-1">
              동일한 유저라면 '기존 유저 업데이트'를, 다른 유저라면 '신규 유저 생성'을 선택하세요.
            </div>
            {hasExactMatch && (
              <div className="text-red-600 text-xs font-medium">
                ⚠️ 정확히 일치하는 닉네임이 발견되어 신규 생성이 불가능합니다.
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleUpsert}
              disabled={!selectedUserSeq}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              기존 유저 업데이트
            </Button>
            
            <Button 
              onClick={handleCreateNew}
              disabled={hasExactMatch}
              className="flex items-center gap-2"
              variant={hasExactMatch ? "outline" : "default"}
            >
              <UserPlus className="h-4 w-4" />
              {hasExactMatch ? "신규 생성 불가" : "신규 유저 생성"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}