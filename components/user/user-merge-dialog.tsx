"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Users, ArrowRight, CheckCircle, XCircle, Loader2, Info, Search, X } from "lucide-react"
import type { User } from "@/types/user"
import { fetchFromAPI } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

interface UserMergeDialogProps {
  isOpen: boolean
  onClose: () => void
  onMergeComplete: () => void
  users: User[]
}

interface MergeStatistics {
  mergedRosterCount: number
  mergedDesertHistoryCount: number
  mergedUserHistoryCount: number
  mergedAllianceMemberCount: number
}

interface UserMergeResponse {
  success: boolean
  mergedUser: User | null
  statistics: MergeStatistics | null
  warnings: string[]
  errorMessage?: string
}

interface UserSearchProps {
  label: string
  placeholder: string
  users: User[]
  selectedUser: User | null
  onUserSelect: (user: User | null) => void
  excludeUser?: User | null
}

function UserSearch({ label, placeholder, users, selectedUser, onUserSelect, excludeUser }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  // 검색어로 사용자 필터링
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    return users
      .filter(user => {
        // 제외할 사용자가 있으면 필터링
        if (excludeUser && user.userSeq === excludeUser.userSeq) return false
        
        // 검색어로 필터링 (닉네임 포함)
        return user.name.toLowerCase().includes(searchTerm.toLowerCase())
      })
      .slice(0, 10) // 최대 10개까지만 표시
  }, [users, searchTerm, excludeUser])

  // 사용자 선택
  const handleUserSelect = (user: User) => {
    onUserSelect(user)
    setSearchTerm("")
    setIsOpen(false)
  }

  // 선택 해제
  const handleClearSelection = () => {
    onUserSelect(null)
    setSearchTerm("")
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {selectedUser ? (
        // 선택된 사용자 표시
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedUser.name}</span>
                  {selectedUser.leave && <Badge variant="destructive">탈퇴</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>레벨: {selectedUser.level}</div>
                  <div>전투력: {selectedUser.power}</div>
                  <div>등급: {selectedUser.userGrade}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // 검색 인터페이스
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsOpen(e.target.value.trim().length > 0)
              }}
              onFocus={() => setIsOpen(searchTerm.trim().length > 0)}
              className="pl-10"
            />
          </div>
          
          {/* 검색 결과 드롭다운 */}
          {isOpen && searchTerm.trim() && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg">
              <CardContent className="p-0">
                <ScrollArea className="max-h-60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.userSeq}
                        className="p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              {user.leave && <Badge variant="destructive" className="text-xs">탈퇴</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Lv.{user.level} | {user.power}M | {user.userGrade}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      "{searchTerm}"와 일치하는 사용자가 없습니다
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export function UserMergeDialog({ isOpen, onClose, onMergeComplete, users }: UserMergeDialogProps) {
  const { toast } = useToast()
  const [sourceUser, setSourceUser] = useState<User | null>(null)
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [isForce, setIsForce] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mergeResult, setMergeResult] = useState<UserMergeResponse | null>(null)
  const [step, setStep] = useState<"setup" | "confirm" | "result">("setup")

  // 다이얼로그 초기화
  const resetDialog = () => {
    setSourceUser(null)
    setTargetUser(null)
    setIsForce(false)
    setMergeResult(null)
    setStep("setup")
  }

  // 다이얼로그 닫기
  const handleClose = () => {
    resetDialog()
    onClose()
  }

  // 사용자 데이터 통합 실행
  const handleMerge = async () => {
    if (!sourceUser || !targetUser) {
      toast({
        title: "입력 오류",
        description: "소스 사용자와 타겟 사용자를 모두 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (sourceUser.userSeq === targetUser.userSeq) {
      toast({
        title: "입력 오류", 
        description: "동일한 사용자를 선택할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchFromAPI("/user/merge", {
        method: "POST",
        body: JSON.stringify({
          sourceUserSeq: sourceUser.userSeq,
          targetUserSeq: targetUser.userSeq,
          force: isForce,
        }),
      })

      setMergeResult(response)
      setStep("result")

      if (response.success) {
        toast({
          title: "통합 완료",
          description: `${sourceUser.name}의 데이터가 ${targetUser.name}로 성공적으로 통합되었습니다.`,
        })
        onMergeComplete()
      } else {
        toast({
          title: response.warnings.length > 0 ? "통합 경고" : "통합 실패",
          description: response.errorMessage || "데이터 통합에 실패했습니다.",
          variant: response.warnings.length > 0 ? "default" : "destructive",
        })
      }
    } catch (error) {
      console.error("사용자 데이터 통합 실패:", error)
      toast({
        title: "통합 실패",
        description: "사용자 데이터 통합 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 확인 단계로 이동
  const handleNext = () => {
    if (!sourceUser || !targetUser) {
      toast({
        title: "입력 오류",
        description: "소스 사용자와 타겟 사용자를 모두 선택해주세요.",
        variant: "destructive",
      })
      return
    }
    setStep("confirm")
  }

  // 뒤로 가기
  const handleBack = () => {
    setStep("setup")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            사용자 데이터 통합
          </DialogTitle>
          <DialogDescription>
            두 사용자의 데이터를 통합합니다. 소스 사용자의 모든 데이터가 타겟 사용자로 이관되며, 소스 사용자는 삭제됩니다.
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                닉네임을 변경한 사용자의 데이터를 기존 사용자로 통합할 때 사용합니다.
                예: "아빠"(신규) → "아빠꽁치"(기존)
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 소스 사용자 (삭제될 사용자) */}
              <UserSearch
                label="소스 사용자 (삭제될 사용자)"
                placeholder="삭제할 사용자 닉네임 검색..."
                users={users}
                selectedUser={sourceUser}
                onUserSelect={setSourceUser}
                excludeUser={targetUser}
              />

              {/* 타겟 사용자 (유지될 사용자) */}
              <UserSearch
                label="타겟 사용자 (유지될 사용자)"
                placeholder="유지할 사용자 닉네임 검색..."
                users={users}
                selectedUser={targetUser}
                onUserSelect={setTargetUser}
                excludeUser={sourceUser}
              />
            </div>

            {/* 강제 통합 옵션 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="force-merge"
                checked={isForce}
                onCheckedChange={setIsForce}
              />
              <Label htmlFor="force-merge" className="text-sm">
                강제 통합 (데이터 충돌이 있어도 강제로 통합)
              </Label>
            </div>

            {/* 미리보기 */}
            {sourceUser && targetUser && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">통합 미리보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="font-medium">{sourceUser.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {sourceUser.userSeq}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                    <div className="text-center">
                      <div className="font-medium">{targetUser.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {targetUser.userSeq}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === "confirm" && sourceUser && targetUser && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>주의:</strong> 이 작업은 되돌릴 수 없습니다. 
                "{sourceUser.name}" 사용자의 모든 데이터가 "{targetUser.name}"로 이관되며, 
                "{sourceUser.name}" 사용자는 완전히 삭제됩니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">통합될 데이터:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  로스터 데이터 (사막전 참여 기록)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  사용자 히스토리 (변경 이력)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  연맹 멤버 데이터
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  기타 사막전 관련 데이터
                </li>
              </ul>
            </div>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 font-medium text-orange-800">
                  <AlertTriangle className="h-4 w-4" />
                  최종 확인
                </div>
                <p className="text-sm text-orange-700 mt-2">
                  "{sourceUser.name}" (ID: {sourceUser.userSeq})의 모든 데이터를 
                  "{targetUser.name}" (ID: {targetUser.userSeq})로 통합하시겠습니까?
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "result" && mergeResult && (
          <div className="space-y-6">
            {mergeResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  사용자 데이터 통합이 성공적으로 완료되었습니다.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {mergeResult.errorMessage || "사용자 데이터 통합에 실패했습니다."}
                </AlertDescription>
              </Alert>
            )}

            {mergeResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">경고 사항:</div>
                    {mergeResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {mergeResult.success && mergeResult.statistics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">통합 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">로스터 데이터</div>
                      <div className="font-medium">{mergeResult.statistics.mergedRosterCount}건</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">사용자 히스토리</div>
                      <div className="font-medium">{mergeResult.statistics.mergedUserHistoryCount}건</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">연맹 멤버 데이터</div>
                      <div className="font-medium">{mergeResult.statistics.mergedAllianceMemberCount}건</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">사막전 히스토리</div>
                      <div className="font-medium">{mergeResult.statistics.mergedDesertHistoryCount}건</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mergeResult.success && mergeResult.mergedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">통합된 사용자 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">닉네임:</span>
                      <span className="font-medium">{mergeResult.mergedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span>{mergeResult.mergedUser.userSeq}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">레벨:</span>
                      <span>{mergeResult.mergedUser.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">전투력:</span>
                      <span>{mergeResult.mergedUser.power}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "setup" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleNext} disabled={!sourceUser || !targetUser}>
                다음
              </Button>
            </>
          )}
          
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                이전
              </Button>
              <Button 
                onClick={handleMerge} 
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    통합 중...
                  </>
                ) : (
                  "데이터 통합 실행"
                )}
              </Button>
            </>
          )}
          
          {step === "result" && (
            <Button onClick={handleClose}>
              닫기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}