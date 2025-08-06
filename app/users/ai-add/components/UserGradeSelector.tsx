"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Star, Shield, Users, User as UserIcon, Check } from "lucide-react"
import { getUserGradeStatistics } from "@/lib/api-service"
import { GradeStatisticsResponse } from "@/types/user"
import { useToast } from "@/hooks/use-toast"

const gradeConfig = {
  R5: {
    label: "R5",
    icon: Crown,
    color: "bg-purple-500 dark:bg-purple-600",
    textColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800",
    selectedBg: "bg-purple-100 dark:bg-purple-900 border-purple-400 dark:border-purple-600",
    description: "최고 등급",
    hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/70"
  },
  R4: {
    label: "R4", 
    icon: Star,
    color: "bg-blue-500 dark:bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800",
    selectedBg: "bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600",
    description: "고급 등급",
    hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/70"
  },
  R3: {
    label: "R3",
    icon: Shield,
    color: "bg-green-500 dark:bg-green-600", 
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800",
    selectedBg: "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600",
    description: "중급 등급",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/70"
  },
  R2: {
    label: "R2",
    icon: Users,
    color: "bg-yellow-500 dark:bg-yellow-600",
    textColor: "text-yellow-700 dark:text-yellow-300", 
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800",
    selectedBg: "bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-600",
    description: "일반 등급",
    hoverColor: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70"
  },
  R1: {
    label: "R1",
    icon: UserIcon,
    color: "bg-gray-500 dark:bg-gray-600",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800",
    selectedBg: "bg-gray-100 dark:bg-gray-900 border-gray-400 dark:border-gray-600",
    description: "기본 등급",
    hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-900/70"
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
    
    // 정원이 꽉 찬 등급인지 확인
    if (gradeStats.hasLimit && gradeStats.available === 0) {
      toast({
        title: "등급 정원 초과",
        description: `${grade} 등급은 현재 정원이 모두 찬 상태입니다. (${gradeStats.count}/${gradeStats.maxUsers})`,
        variant: "destructive"
      })
      return
    }
    
    onGradeSelect(grade)
  }

  if (isLoading || !statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            1단계: 등급 선택
          </CardTitle>
          <p className="text-muted-foreground">
            새로 등록할 유저들의 연맹 등급을 선택해주세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          1단계: 등급 선택
        </CardTitle>
        <p className="text-muted-foreground">
          새로 등록할 유저들의 연맹 등급을 선택해주세요. 현재 활동 중인 인원과 여유 슬롯을 확인하세요.
        </p>
        <p className="text-sm text-muted-foreground">
          전체 활동 인원: <span className="font-semibold text-foreground">{statistics.totalUsers}</span>명
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(gradeConfig).map(([grade, config]) => {
            const gradeStats = statistics.gradeDistribution[grade as keyof typeof statistics.gradeDistribution]
            const Icon = config.icon
            const isSelected = selectedGrade === grade
            const isDisabled = gradeStats.hasLimit && gradeStats.available === 0
            
            return (
              <div
                key={grade}
                className={`
                  ${isSelected ? config.selectedBg : config.bgColor} 
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isDisabled && !isSelected ? config.hoverColor : ''}
                  rounded-lg p-4 transition-all duration-200 border-2
                  ${isSelected ? 'shadow-md scale-105' : 'hover:shadow-lg dark:hover:shadow-black/25'}
                  ${!isDisabled ? 'hover:scale-105 active:scale-95' : ''}
                `}
                onClick={() => !isDisabled && handleGradeSelect(grade)}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className={`${config.color} text-white`}>
                    {config.label}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="h-4 w-4 text-green-600" />}
                    <Icon className={`h-5 w-5 ${config.textColor}`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{gradeStats.count}</span>
                    <span className="text-sm text-muted-foreground">명</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {config.description}
                  </div>
                  
                  {gradeStats.hasLimit && (
                    <div className="text-xs">
                      <div className="text-muted-foreground">
                        최대 {gradeStats.maxUsers}명
                      </div>
                      {gradeStats.available > 0 && (
                        <div className="text-green-600 dark:text-green-400 font-medium">
                          {gradeStats.available}명 여유
                        </div>
                      )}
                      {gradeStats.available === 0 && (
                        <div className="text-red-600 dark:text-red-400 font-medium">
                          정원 만료
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedGrade && (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {gradeConfig[selectedGrade as keyof typeof gradeConfig].label} 등급이 선택되었습니다
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  이제 스크린샷 이미지를 업로드해주세요.
                </p>
              </div>
            </div>
            <Button onClick={onNext} className="bg-green-600 hover:bg-green-700">
              다음 단계
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}