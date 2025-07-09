"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Shuffle } from "lucide-react"
import { getUsers } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types/user"
import { UserSelection } from "@/components/lottery/user-selection"
import { LotteryAnimation } from "@/components/lottery/lottery-animation"
import { LotteryResult } from "@/components/lottery/lottery-result"

// 전투력 포맷팅 함수 (1 = 1백만)
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

export default function LotteryPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [winners, setWinners] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [drawCount, setDrawCount] = useState<number | "">("")
  const [activeTab, setActiveTab] = useState("selection")

  const MAX_SELECTIONS = 50
  const MAX_DRAW_COUNT = 50

  // 유저 목록 로드
  useEffect(() => {
    
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const data = await getUsers()
        setUsers(data)
      } catch (error) {
        console.error("유저 목록 로드 실패:", error)
        toast({
          title: "오류 발생",
          description: "유저 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  // 추첨 시작
  const startLottery = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "선택된 유저 없음",
        description: "추첨할 유저를 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    if (drawCount === "" || drawCount <= 0 || drawCount > selectedUsers.length) {
      toast({
        title: "유효하지 않은 추첨 인원",
        description: `추첨 인원은 1명에서 ${selectedUsers.length}명 사이여야 합니다.`,
        variant: "destructive"
      })
      return
    }

    console.log('추첨 시작:', {
      selectedCount: selectedUsers.length,
      drawCount: Number(drawCount) 
    })

    setIsAnimating(true)
    setActiveTab("animation")
  }

  // 애니메이션 완료 처리
  const handleAnimationComplete = (winners: User[]) => {
    setWinners(winners)
    setIsAnimating(false)
    setActiveTab("result")
    
    console.log('추첨 완료:', {
      winnerCount: winners.length,
      winners: winners.map(w => w.name)
    })
  }

  // 새로운 추첨 시작
  const startNewLottery = () => {
    setWinners([])
    setActiveTab("selection")
  }

  // 추첨 인원 변경 처리
  const handleDrawCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? "" : Number.parseInt(e.target.value, 10)
    setDrawCount(value === "" ? "" : isNaN(value) ? "" : value)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">유저 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">연맹원 랜덤뽑기</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="selection">
            유저 선택
          </TabsTrigger>
          <TabsTrigger value="result" disabled={winners.length === 0}>
            추첨 결과
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selection">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>유저 선택</CardTitle>
                  <CardDescription>추첨에 참여할 유저를 선택하세요 (최대 {MAX_SELECTIONS}명)</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserSelection
                    users={users}
                    selectedUsers={selectedUsers}
                    onSelectUsers={setSelectedUsers}
                    maxSelections={MAX_SELECTIONS}
                    enableListItemClick={true}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>추첨 설정</CardTitle>
                  <CardDescription>추첨 인원 및 옵션을 설정하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (
                        !(
                          selectedUsers.length === 0 ||
                          drawCount === "" ||
                          drawCount <= 0 ||
                          drawCount > selectedUsers.length
                        )
                      ) {
                        startLottery()
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="drawCount">추첨 인원</Label>
                      <Input
                        id="drawCount"
                        type="number"
                        min={1}
                        max={Math.min(selectedUsers.length || 1, MAX_DRAW_COUNT)}
                        value={drawCount}
                        onChange={handleDrawCountChange}
                        placeholder="추첨할 인원 수를 입력하세요"
                        disabled={isAnimating}
                      />
                      <p className="text-xs text-muted-foreground">
                        선택된 {selectedUsers.length}명 중 {drawCount}명을 추첨합니다.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={
                          isAnimating ||
                          selectedUsers.length === 0 ||
                          drawCount === "" ||
                          drawCount <= 0 ||
                          drawCount > selectedUsers.length
                        }
                        className="w-full"
                      >
                        <Shuffle className="mr-2 h-4 w-4" />
                        {isAnimating ? "추첨 중..." : "추첨 시작"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Card className="h-[62.5vh]">
                  <CardHeader>
                    <CardTitle>선택된 유저</CardTitle>
                    <CardDescription>
                      {selectedUsers.length}명 선택됨 (최대 {MAX_SELECTIONS}명)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[52.5vh] overflow-y-auto space-y-2">
                      {selectedUsers.length > 0 ? (
                        selectedUsers.map((user) => (
                          <div key={user.userSeq} className="text-sm p-2 border-b">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Lv.{user.level} | {formatPower(user.power)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">선택된 유저가 없습니다.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="result">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LotteryResult winners={winners} drawCount={typeof drawCount === "number" ? drawCount : 0} totalSelected={selectedUsers.length} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>다음 추첨</CardTitle>
                  <CardDescription>새로운 추첨을 시작하거나 설정을 변경하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={startNewLottery} className="w-full">
                    새로운 추첨 시작
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAnimating(true)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    같은 설정으로 다시 추첨
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 추첨 애니메이션 오버레이 */}
      {isAnimating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LotteryAnimation
            selectedUsers={selectedUsers}
            winnerCount={typeof drawCount === "number" ? drawCount : 0}
            isAnimating={isAnimating}
            onAnimationComplete={handleAnimationComplete}
          />
        </div>
      )}
    </div>
  )
}
