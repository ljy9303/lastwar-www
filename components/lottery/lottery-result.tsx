"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Share2 } from "lucide-react"
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
  const [isExporting, setIsExporting] = useState(false)

  if (winners.length === 0) {
    return null
  }

  // 결과 내보내기 (CSV)
  const exportResults = () => {
    setIsExporting(true)
    try {
      const headers = ["순위", "닉네임", "레벨", "전투력", "연맹 상태"]
      const csvContent = [
        headers.join(","),
        ...winners.map((winner, index) =>
          [index + 1, winner.name, winner.level, winner.power, winner.leave ? "탈퇴" : "활동중"].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `열차장_랜덤뽑기_결과_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "내보내기 성공",
        description: "추첨 결과가 CSV 파일로 저장되었습니다.",
      })
    } catch (error) {
      console.error("내보내기 실패:", error)
      toast({
        title: "내보내기 실패",
        description: "파일 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 결과 공유
  const shareResults = async () => {
    try {
      const text =
        `열차장 랜덤뽑기 결과 (${format(new Date(), "yyyy년 MM월 dd일", { locale: ko })})\n\n` +
        `${totalSelected}명 중 ${drawCount}명 추첨\n\n` +
        winners.map((winner, index) => `${index + 1}. ${winner.name} (Lv.${winner.level})`).join("\n")

      if (navigator.share) {
        await navigator.share({
          title: "열차장 랜덤뽑기 결과",
          text: text,
        })
      } else {
        await navigator.clipboard.writeText(text)
        toast({
          title: "클립보드에 복사됨",
          description: "추첨 결과가 클립보드에 복사되었습니다.",
        })
      }
    } catch (error) {
      console.error("공유 실패:", error)
      toast({
        title: "공유 실패",
        description: "결과를 공유하는 중 오류가 발생했습니다.",
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
                  <div className="font-medium">{winner.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Lv.{winner.level} | {winner.power.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium">{winner.leave ? "탈퇴" : "활동중"}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={shareResults}>
          <Share2 className="h-4 w-4 mr-2" />
          공유하기
        </Button>
        <Button onClick={exportResults} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "내보내는 중..." : "CSV 내보내기"}
        </Button>
      </CardFooter>
    </Card>
  )
}
