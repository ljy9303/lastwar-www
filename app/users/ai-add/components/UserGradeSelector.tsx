"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, Star, Shield, Users, User as UserIcon, Check, TrendingUp, AlertCircle } from "lucide-react"
import { getUserGradeStatistics } from "@/lib/api-service"
import { GradeStatisticsResponse } from "@/types/user"
import { useToast } from "@/hooks/use-toast"

const gradeConfig = {
  // R5 등급은 AI 유저 등록에서 제외 (관리자 전용 등급)
  R4: {
    label: "R4", 
    name: "고위 지휘관",
    icon: Star,
    color: "bg-gradient-to-r from-blue-500 to-indigo-600",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800",
    selectedBg: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/70 dark:to-indigo-900/70 border-blue-400 dark:border-blue-600",
    description: "전략 수립 및 고급 작전 지휘",
    hoverColor: "hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 hover:scale-102",
    priority: 4
  },
  R3: {
    label: "R3",
    name: "전투 지휘관",
    icon: Shield,
    color: "bg-gradient-to-r from-green-500 to-emerald-600", 
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800",
    selectedBg: "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/70 dark:to-emerald-900/70 border-green-400 dark:border-green-600",
    description: "중대급 부대 지휘 및 전술 운용",
    hoverColor: "hover:shadow-lg hover:shadow-green-200/50 dark:hover:shadow-green-900/30 hover:scale-102",
    priority: 3
  },
  R2: {
    label: "R2",
    name: "소대장",
    icon: Users,
    color: "bg-gradient-to-r from-yellow-500 to-orange-500",
    textColor: "text-yellow-700 dark:text-yellow-300", 
    bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border border-yellow-200 dark:border-yellow-800",
    selectedBg: "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/70 dark:to-orange-900/70 border-yellow-400 dark:border-yellow-600",
    description: "소규모 팀 리더십 및 작전 지원",
    hoverColor: "hover:shadow-lg hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30 hover:scale-102",
    priority: 2
  },
  R1: {
    label: "R1",
    name: "일반 전투원",
    icon: UserIcon,
    color: "bg-gradient-to-r from-gray-500 to-slate-600",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50 border border-gray-200 dark:border-gray-800",
    selectedBg: "bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/70 dark:to-slate-900/70 border-gray-400 dark:border-gray-600",
    description: "기본 전투 임무 수행 및 훈련 참가",
    hoverColor: "hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30 hover:scale-102",
    priority: 1
  }
}

interface UserGradeSelectorProps {
  selectedGrade: string | null
  onGradeSelect: (grade: string) => void
  onNext: () => void
}

export function UserGradeSelector({ selectedGrade, onGradeSelect, onNext }: UserGradeSelectorProps) {
  const { toast } = useToast()
  const [statistics, setStatistics] = useState<GradeStatisticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStatistics = async () => {
    setIsLoading(true)
    try {
      const data = await getUserGradeStatistics()
      setStatistics(data)
    } catch (error) {
      console.error("등급별 통계 로드 실패:", error)
      toast({
        title: "통계 로드 실패",
        description: "등급별 통계를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  const handleGradeSelect = (grade: string) => {
    if (!statistics) return
    
    const gradeStats = statistics.gradeDistribution[grade as keyof typeof statistics.gradeDistribution]
    const gradeInfo = gradeConfig[grade as keyof typeof gradeConfig]
    
    // 정원이 꽉 찬 등급인지 확인
    if (gradeStats.hasLimit && gradeStats.available === 0) {
      toast({
        title: "등급 정원 초과",
        description: `${gradeInfo.name} (${grade}) 등급은 현재 정원이 모두 찬 상태입니다. (${gradeStats.count}/${gradeStats.maxUsers})`,
        variant: "destructive"
      })
      return
    }
    
    // 성공적 선택 피드백
    toast({
      title: "등급 선택됨",
      description: `${gradeInfo.name} (${grade}) 등급이 선택되었습니다. ${gradeStats.available > 0 ? `${gradeStats.available}명의 여유 슬롯이 있습니다.` : ''}`,
      duration: 3000,
    })
    
    onGradeSelect(grade)
  }

  if (isLoading || !statistics) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            1단계: 등급 선택
          </CardTitle>
          <p className="text-muted-foreground">
            새로 등록할 유저들의 연맹 등급을 선택해주세요. 등급별 현황을 확인하고 있습니다.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-blue-200 dark:border-blue-800 opacity-0"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-blue-600" />
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              1단계: 등급 선택
            </span>
          </CardTitle>
          <div className="space-y-2 mt-3">
            <p className="text-muted-foreground">
              새로 등록할 유저들의 연맹 등급을 선택해주세요. 각 등급별 현황과 역할을 확인하세요.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">전체 활동 인원: </span>
                <span className="font-bold text-blue-600 text-lg">{statistics.totalUsers}명</span>
              </div>
            </div>
          </div>
        </motion.div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(gradeConfig).map(([grade, config], index) => {
            const gradeStats = statistics.gradeDistribution[grade as keyof typeof statistics.gradeDistribution]
            const Icon = config.icon
            const isSelected = selectedGrade === grade
            const isDisabled = gradeStats.hasLimit && gradeStats.available === 0
            const utilizationRate = gradeStats.hasLimit ? (gradeStats.count / gradeStats.maxUsers) * 100 : 0
            
            return (
              <motion.div
                key={grade}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                className={`
                  relative group rounded-xl p-5 border-2 transition-all duration-300 cursor-pointer
                  ${isSelected ? config.selectedBg + ' shadow-xl' : config.bgColor} 
                  ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isDisabled && !isSelected ? config.hoverColor : ''}
                  ${isSelected ? 'shadow-2xl ring-4 ring-blue-200 dark:ring-blue-800 transform scale-105' : 'hover:shadow-xl'}
                `}
                onClick={() => !isDisabled && handleGradeSelect(grade)}
              >
                {/* 선택 표시 */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 z-10"
                  >
                    <div className="bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                      <Check className="h-4 w-4" />
                    </div>
                  </motion.div>
                )}
                
                {/* 정원 초과 경고 */}
                {isDisabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 z-10"
                  >
                    <div className="bg-red-500 text-white rounded-full p-1.5 shadow-lg">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </motion.div>
                )}

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    className={`${config.color} text-white border-0 shadow-sm text-sm font-bold px-3 py-1`}
                  >
                    {config.label}
                  </Badge>
                  <div className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <Icon className={`h-6 w-6 ${config.textColor}`} />
                  </div>
                </div>
                
                {/* 등급명 */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {config.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* 통계 정보 */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {gradeStats.count}
                      </div>
                      <div className="text-xs text-muted-foreground">현재 인원</div>
                    </div>
                    {config.priority && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          우선도 {config.priority}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {gradeStats.hasLimit && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">정원 현황</span>
                        <span className="font-medium">
                          {gradeStats.count} / {gradeStats.maxUsers}
                        </span>
                      </div>
                      
                      {/* 프로그레스 바 */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${utilizationRate}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            utilizationRate >= 90 ? 'bg-red-500' :
                            utilizationRate >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        {gradeStats.available > 0 ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{gradeStats.available}명 여유</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-medium">정원 만료</span>
                          </div>
                        )}
                        <span className="text-muted-foreground">
                          {utilizationRate.toFixed(0)}% 사용
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 선택 완료 알림 */}
        <AnimatePresence>
          {selectedGrade && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/50 dark:via-emerald-950/50 dark:to-teal-950/50 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex-shrink-0"
                  >
                    <div className="p-3 bg-green-500 rounded-full shadow-lg">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <motion.h4
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg font-bold text-green-800 dark:text-green-200"
                    >
                      {gradeConfig[selectedGrade as keyof typeof gradeConfig].name} ({gradeConfig[selectedGrade as keyof typeof gradeConfig].label}) 선택됨
                    </motion.h4>
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-green-600 dark:text-green-400"
                    >
                      다음 단계에서 연맹원 목록 스크린샷을 업로드해주세요
                    </motion.p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    onClick={onNext} 
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    다음 단계
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      →
                    </motion.div>
                  </Button>
                </motion.div>
                
                {/* 배경 장식 */}
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-16 translate-x-16"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}