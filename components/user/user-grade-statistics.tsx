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
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    description: "최고 등급"
  },
  R4: {
    label: "R4", 
    icon: Star,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    description: "고급 등급"
  },
  R3: {
    label: "R3",
    icon: Shield,
    color: "bg-green-500", 
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    description: "중급 등급"
  },
  R2: {
    label: "R2",
    icon: Users,
    color: "bg-yellow-500",
    textColor: "text-yellow-700", 
    bgColor: "bg-yellow-50",
    description: "일반 등급"
  },
  R1: {
    label: "R1",
    icon: UserIcon,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50", 
    description: "기본 등급"
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
          <p className="text-center text-gray-500">통계를 불러올 수 없습니다.</p>
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
        <p className="text-sm text-gray-600">
          전체 활동 인원: <span className="font-semibold">{statistics.totalUsers}</span>명
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
                className={`${config.bgColor} rounded-lg p-4 transition-all duration-200 ${
                  onGradeClick 
                    ? 'hover:shadow-md cursor-pointer hover:scale-105' 
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
                    <span className="text-2xl font-bold">{gradeStats.count}</span>
                    <span className="text-sm text-gray-600">명</span>
                  </div>
                  
                  
                  {gradeStats.hasLimit && (
                    <div className="text-xs text-gray-500">
                      최대 {gradeStats.maxUsers}명
                      {gradeStats.available > 0 && (
                        <span className="text-green-600 ml-1">
                          ({gradeStats.available}명 여유)
                        </span>
                      )}
                      {gradeStats.available === 0 && (
                        <span className="text-red-600 ml-1">
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