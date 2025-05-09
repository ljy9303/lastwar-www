"use client"

import { useState, useEffect, useRef } from "react"
import type { User } from "@/types/user"
import { motion } from "framer-motion"
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
  const [visibleUsers, setVisibleUsers] = useState<User[]>([])

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

    // 초기 슬롯 머신 표시 유저 설정 (5명)
    setVisibleUsers(getRandomUsers(5))

    // 애니메이션 시작
    let animationTimer: NodeJS.Timeout
    let count = 0
    const maxCount = 40 + winnerCount * 5 // 당첨자 수에 따라 애니메이션 길이 조정

    // 초기 속도 - 매우 빠름
    setSpeed(50)

    const animate = () => {
      // 슬롯 머신 효과를 위해 표시되는 유저 업데이트
      setVisibleUsers(getRandomUsers(5))
      count++

      // 슬롯 머신 효과를 위한 속도 조절
      if (count > maxCount * 0.9) {
        // 마지막 10%에서 급격히 느려짐
        setSpeed((prevSpeed) => Math.min(prevSpeed * 1.5, 1000))
      } else if (count > maxCount * 0.7) {
        // 70-90% 구간에서 점점 느려짐
        setSpeed((prevSpeed) => Math.min(prevSpeed * 1.2, 500))
      } else if (count > maxCount * 0.5) {
        // 50-70% 구간에서 서서히 느려짐
        setSpeed((prevSpeed) => Math.min(prevSpeed + 20, 200))
      } else if (count > maxCount * 0.2) {
        // 20-50% 구간에서 일정 속도 유지
        setSpeed((prevSpeed) => prevSpeed)
      } else {
        // 처음 20%에서 빨라짐
        setSpeed((prevSpeed) => Math.max(prevSpeed - 3, 30))
      }

      // 애니메이션 종료
      if (count >= maxCount) {
        clearTimeout(animationTimer)

        // 마지막에 당첨자를 슬롯에 표시
        if (winnerCount <= 5) {
          // 당첨자가 5명 이하면 모두 표시
          setVisibleUsers([...selectedWinners])
        } else {
          // 당첨자가 5명 초과면 첫 5명만 표시
          setVisibleUsers([...selectedWinners.slice(0, 5)])
        }

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
        setTimeout(() => {
          onAnimationComplete(selectedWinners)
        }, 800)
        return
      }

      animationTimer = setTimeout(animate, speed)
    }

    // 랜덤 유저 선택 함수
    function getRandomUsers(count: number) {
      const result: User[] = []
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * selectedUsers.length)
        result.push(selectedUsers[randomIndex])
      }
      return result
    }

    // 애니메이션 시작
    animationTimer = setTimeout(animate, speed)

    // 클린업
    return () => {
      clearTimeout(animationTimer)
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
        <h3 className="text-xl font-bold text-center mb-6">연맹원 랜덤 추첨 중...</h3>

        {!isComplete ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            {/* 슬롯 머신 효과 */}
            <div className="relative w-full overflow-hidden mb-4 border border-primary/20 rounded-lg bg-accent/20 p-2">
              {/* 슬롯 머신 상단 그라데이션 */}
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent z-10" />

              {/* 슬롯 머신 하단 그라데이션 */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent z-10" />

              {/* 중앙 선택 표시 */}
              <div className="absolute inset-x-0 top-1/2 h-14 -translate-y-1/2 border-y-2 border-primary z-20 pointer-events-none" />

              {/* 슬롯 아이템들 */}
              <div className="py-20">
                {visibleUsers.map((user, idx) => (
                  <div
                    key={`${user.userSeq}-${idx}`}
                    className={`py-3 text-center transition-all duration-200 ${idx === 2 ? "scale-110 font-bold" : "opacity-70"}`}
                  >
                    <div className="text-lg">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Lv.{user.level} | {user.power.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mt-4">
              <div className="relative w-12 h-12 mb-2">
                <Loader2 className="h-12 w-12 animate-spin text-primary absolute" />
                <div className="h-12 w-12 rounded-full border-2 border-primary/30 absolute"></div>
              </div>
              <span className="text-primary font-medium animate-pulse">추첨 중...</span>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedUsers.length}명 중 {winnerCount}명 선정 중
              </p>
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
