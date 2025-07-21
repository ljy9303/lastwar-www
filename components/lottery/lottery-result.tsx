"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface LotteryResultProps {
  winners: User[]
  drawCount: number
  totalSelected: number
}

export function LotteryResult({ winners, drawCount, totalSelected }: LotteryResultProps) {
  const { toast } = useToast()

  if (winners.length === 0) {
    return null
  }

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

  // 닉네임 복사 기능
  const copyNickname = async (nickname: string) => {
    try {
      await navigator.clipboard.writeText(nickname)
      toast({
        title: "복사 완료",
        description: `"${nickname}" 닉네임이 클립보드에 복사되었습니다.`,
      })
    } catch (error) {
      console.error("복사 실패:", error)
      toast({
        title: "복사 실패",
        description: "닉네임 복사 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>추첨 결과</CardTitle>
        <CardDescription>
          {format(new Date(), "yyyy년 MM월 dd일 HH:mm", { locale: ko })} | {totalSelected}명 중 {drawCount}명 추첨
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {winners.map((winner, index) => (
            <div key={winner.userSeq} className="flex items-center justify-between p-3 rounded-md bg-accent/50 border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{winner.name}</span>
                    {winner.userGrade && (
                      <Badge variant="outline" className="text-xs">
                        {winner.userGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Lv.{winner.level} | {formatPower(winner.power)} | 활동중
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyNickname(winner.name)}
                  className="h-8 w-8 p-0"
                  title={`"${winner.name}" 닉네임 복사`}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
