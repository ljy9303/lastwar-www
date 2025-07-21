"use client"

import { useState, useEffect, useRef } from "react"
import type { User } from "@/types/user"
import { motion, AnimatePresence } from "framer-motion"
import { Stars, Gift, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { Badge } from "@/components/ui/badge"

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
  const [animationPhase, setAnimationPhase] = useState<"shuffling" | "revealing" | "complete">("shuffling")
  const [winners, setWinners] = useState<User[]>([])
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0)
  const [displayUsers, setDisplayUsers] = useState<User[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // 전투력 포맷팅 함수
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

  // 애니메이션 효과
  useEffect(() => {
    if (!isAnimating) {
      setAnimationPhase("shuffling")
      setWinners([])
      setCurrentRevealIndex(0)
      setDisplayUsers([])
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
    setWinners(selectedWinners)

    // 1단계: 셔플링 애니메이션 (2초)
    setAnimationPhase("shuffling")
    let shuffleTimer: NodeJS.Timeout
    let shuffleCount = 0
    const maxShuffleCount = 20

    const shuffleAnimation = () => {
      // 랜덤한 유저들을 표시
      const randomUsers = []
      for (let i = 0; i < Math.min(6, selectedUsers.length); i++) {
        const randomIndex = Math.floor(Math.random() * selectedUsers.length)
        randomUsers.push(selectedUsers[randomIndex])
      }
      setDisplayUsers(randomUsers)

      shuffleCount++
      if (shuffleCount >= maxShuffleCount) {
        clearTimeout(shuffleTimer)
        // 2단계: 당첨자 공개 애니메이션 시작
        setTimeout(() => {
          setAnimationPhase("revealing")
          setCurrentRevealIndex(0)
        }, 300)
        return
      }

      const nextDelay = 50 + shuffleCount * 8 // 점점 느려지는 효과
      shuffleTimer = setTimeout(shuffleAnimation, nextDelay)
    }

    shuffleTimer = setTimeout(shuffleAnimation, 100)

    // 클린업
    return () => {
      clearTimeout(shuffleTimer)
    }
  }, [isAnimating, selectedUsers, winnerCount])

  // 당첨자 공개 애니메이션
  useEffect(() => {
    if (animationPhase !== "revealing" || currentRevealIndex >= winners.length) {
      if (animationPhase === "revealing" && currentRevealIndex >= winners.length) {
        // 모든 당첨자 공개 완료
        setTimeout(() => {
          setAnimationPhase("complete")
          
          // 축하 효과
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const x = (rect.left + rect.right) / 2 / window.innerWidth
            const y = (rect.top + rect.bottom) / 2 / window.innerHeight

            // 여러 번의 폭죽 효과
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { x: x + (Math.random() - 0.5) * 0.4, y: y - 0.1 },
                  colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
                })
              }, i * 200)
            }
          }

          // 결과 전달
          setTimeout(() => {
            onAnimationComplete(winners)
          }, 1500)
        }, 500)
      }
      return
    }

    const revealTimer = setTimeout(() => {
      setCurrentRevealIndex(prev => prev + 1)
    }, 800) // 각 당첨자를 0.8초 간격으로 공개

    return () => clearTimeout(revealTimer)
  }, [animationPhase, currentRevealIndex, winners, onAnimationComplete])

  if (!isAnimating) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl shadow-2xl p-8 border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 animate-pulse">
          <Stars className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="absolute top-8 right-8 animate-bounce">
          <Sparkles className="h-5 w-5 text-pink-500" />
        </div>
        <div className="absolute bottom-6 left-8 animate-pulse">
          <Gift className="h-6 w-6 text-green-500" />
        </div>
        <div className="absolute bottom-4 right-4 animate-bounce">
          <Stars className="h-4 w-4 text-blue-500" />
        </div>
      </div>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🎲 연맹원 랜덤 추첨 🎲
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedUsers.length}명 중 {winnerCount}명 선정
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {animationPhase === "shuffling" && (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[350px] flex flex-col items-center justify-center"
            >
              {/* 셔플링 카드들 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {displayUsers.slice(0, 4).map((user, index) => (
                  <motion.div
                    key={`shuffle-${user.userSeq}-${index}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-32 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg border-2 border-blue-200 dark:border-blue-700 flex flex-col items-center justify-center p-2"
                  >
                    <div className="text-sm font-medium truncate w-full text-center">
                      {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lv.{user.level}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 로딩 애니메이션 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 mb-4"
              />
              
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-lg font-medium text-blue-600 dark:text-blue-400"
              >
                추첨 중...
              </motion.div>
            </motion.div>
          )}

          {animationPhase === "revealing" && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[350px]"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl font-bold text-green-600 dark:text-green-400"
                >
                  🎉 당첨자 발표 🎉
                </motion.div>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {winners.slice(0, currentRevealIndex + 1).map((winner, index) => (
                  <motion.div
                    key={winner.userSeq}
                    initial={{ opacity: 0, scale: 0, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      delay: index === currentRevealIndex ? 0 : 0
                    }}
                    className="relative bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg"
                  >
                    {/* 순위 뱃지 */}
                    <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>

                    <div className="flex items-center justify-between ml-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{winner.name}</span>
                            {winner.userGrade && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                {winner.userGrade}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Lv.{winner.level} | {formatPower(winner.power)}
                          </div>
                        </div>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                        className="text-2xl"
                      >
                        🏆
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {animationPhase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎊
              </motion.div>
              
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                추첨 완료!
              </div>
              
              <div className="text-lg text-muted-foreground">
                총 {winners.length}명의 당첨자가 선정되었습니다
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
