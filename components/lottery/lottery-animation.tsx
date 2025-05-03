"use client"

import { useState, useEffect, useRef } from "react"
import type { User } from "@/types/user"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import confetti from "canvas-confetti"

interface LotteryAnimationProps {
  selectedUsers: User[]
  winnerCount: number
  isAnimating: boolean
  onAnimationComplete: (winners: User[]) => void
}

export function LotteryAnimation({
  selectedUsers,
  winnerCount,
  isAnimating,
  onAnimationComplete,
}: LotteryAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState(100)
  const [winners, setWinners] = useState<User[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 애니메이션 효과
  useEffect(() => {
    if (!isAnimating) {
      setCurrentIndex(0)
      setSpeed(100)
      setWinners([])
      setIsComplete(false)
      return
    }

    // 선택된 유저가 없거나 당첨자 수가 0이면 애니메이션 실행하지 않음
    if (selectedUsers.length === 0 || winnerCount <= 0) {
      onAnimationComplete([])
      return
    }

    // 랜덤으로 당첨자 선정
    const shuffledUsers = [...selectedUsers].sort(() => Math.random() - 0.5)
    const selectedWinners = shuffledUsers.slice(0, winnerCount)

    // 애니메이션 시작
    let animationTimer: NodeJS.Timeout
    let speedUpTimer: NodeJS.Timeout
    let count = 0
    const maxCount = 30 + winnerCount * 5 // 당첨자 수에 따라 애니메이션 길이 조정

    const animate = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % selectedUsers.length)
      count++

      // 애니메이션 속도 조절
      if (count > maxCount * 0.7) {
        setSpeed((prevSpeed) => Math.min(prevSpeed + 20, 300))
      } else if (count > maxCount * 0.4) {
        setSpeed((prevSpeed) => Math.min(prevSpeed + 10, 200))
      } else {
        setSpeed((prevSpeed) => Math.max(prevSpeed - 5, 50))
      }

      // 애니메이션 종료
      if (count >= maxCount) {
        clearTimeout(animationTimer)
        setWinners(selectedWinners)
        setIsComplete(true)

        // 축하 효과
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const x = (rect.left + rect.right) / 2 / window.innerWidth
          const y = (rect.top + rect.bottom) / 2 / window.innerHeight

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y: y - 0.1 },
          })
        }

        // 결과 전달
        onAnimationComplete(selectedWinners)
        return
      }

      animationTimer = setTimeout(animate, speed)
    }

    // 애니메이션 시작
    animationTimer = setTimeout(animate, speed)

    // 클린업
    return () => {
      clearTimeout(animationTimer)
      clearTimeout(speedUpTimer)
    }
  }, [isAnimating, selectedUsers, winnerCount, onAnimationComplete])

  if (!isAnimating) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto bg-background rounded-lg shadow-lg p-8 border border-primary/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-0" />

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-center mb-6">열차장 랜덤 추첨 중...</h3>

        {!isComplete ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="relative w-full h-20 overflow-hidden mb-4">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold">{selectedUsers[currentIndex]?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Lv.{selectedUsers[currentIndex]?.level} | {selectedUsers[currentIndex]?.power.toLocaleString()}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-center mt-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>추첨 중...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold">🎉 추첨 완료! 🎉</div>
              <div className="text-sm text-muted-foreground">{winners.length}명의 당첨자가 선정되었습니다</div>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.userSeq}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/10"
                >
                  <div>
                    <div className="font-medium">{winner.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Lv.{winner.level} | {winner.power.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary">#{index + 1}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
