"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown, Star, Shield, Users, User as UserIcon } from "lucide-react"
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
    description: "최고 등급",
    hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/70"
  },
  R4: {
    label: "R4", 
    icon: Star,
    color: "bg-blue-500 dark:bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800",
    description: "고급 등급",
    hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/70"
  },
  R3: {
    label: "R3",
    icon: Shield,
    color: "bg-green-500 dark:bg-green-600", 
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800",
    description: "중급 등급",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/70"
  },
  R2: {
    label: "R2",
    icon: Users,
    color: "bg-yellow-500 dark:bg-yellow-600",
    textColor: "text-yellow-700 dark:text-yellow-300", 
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800",
    description: "일반 등급",
    hoverColor: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70"
  },
  R1: {
    label: "R1",
    icon: UserIcon,
    color: "bg-gray-500 dark:bg-gray-600",
    textColor: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800", 
    description: "기본 등급",
    hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-900/70"
  }
}

interface UserGradeStatisticsProps {
  onGradeClick?: (grade: string) => void
}

export function UserGradeStatistics({ onGradeClick }: UserGradeStatisticsProps) {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            등급별 활동 인원
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            등급별 활동 인원
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">통계를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          등급별 활동 인원
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          전체 활동 인원: <span className="font-semibold text-foreground">{statistics.totalUsers}</span>명
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(gradeConfig).map(([grade, config]) => {
            const gradeStats = statistics.gradeDistribution[grade as keyof typeof statistics.gradeDistribution]
            const Icon = config.icon
            
            return (
              <div
                key={grade}
                className={`${config.bgColor} ${config.hoverColor} rounded-lg p-4 transition-all duration-200 ${
                  onGradeClick 
                    ? 'hover:shadow-lg dark:hover:shadow-black/25 cursor-pointer hover:scale-105 active:scale-95' 
                    : ''
                }`}
                onClick={() => onGradeClick?.(grade)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className={`${config.color} text-white`}>
                    {config.label}
                  </Badge>
                  <Icon className={`h-5 w-5 ${config.textColor}`} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{gradeStats.count}</span>
                    <span className="text-sm text-muted-foreground">명</span>
                  </div>
                  
                  
                  {gradeStats.hasLimit && (
                    <div className="text-xs text-muted-foreground">
                      최대 {gradeStats.maxUsers}명
                      {gradeStats.available > 0 && (
                        <span className="text-green-600 dark:text-green-400 ml-1">
                          ({gradeStats.available}명 여유)
                        </span>
                      )}
                      {gradeStats.available === 0 && (
                        <span className="text-red-600 dark:text-red-400 ml-1">
                          (정원 만료)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}