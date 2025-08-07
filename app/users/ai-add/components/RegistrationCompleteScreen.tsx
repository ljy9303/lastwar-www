"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Users, 
  UserPlus, 
  UserCheck,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Trophy,
  Home
} from "lucide-react"
import { useRouter } from "next/navigation"

interface RegistrationCompleteScreenProps {
  insertedCount: number
  updatedCount: number
  rejoinedCount: number
  failedCount: number
  selectedGrade: string
  onStartNew: () => void
}

export function RegistrationCompleteScreen({
  insertedCount,
  updatedCount,
  rejoinedCount,
  failedCount,
  selectedGrade,
  onStartNew
}: RegistrationCompleteScreenProps) {
  const router = useRouter()
  const totalSuccess = insertedCount + updatedCount + rejoinedCount

  return (
    <Card className="overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 text-center">
        <div className="ai-fade-in space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                등록 완료! 🎉
              </span>
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              AI 연맹원 등록이 성공적으로 완료되었습니다
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-8">
        {/* 결과 통계 */}
        <div className="ai-slide-up space-y-4" style={{animationDelay: '0.2s'}}>
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-yellow-500" />
            처리 결과 요약
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 성공 통계 */}
            {totalSuccess > 0 && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 dark:text-green-300 font-medium">성공</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {totalSuccess}명
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {insertedCount > 0 && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <UserPlus className="h-4 w-4" />
                      신규 등록: {insertedCount}명
                    </div>
                  )}
                  {updatedCount > 0 && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <UserCheck className="h-4 w-4" />
                      업데이트: {updatedCount}명
                    </div>
                  )}
                  {rejoinedCount > 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <RotateCcw className="h-4 w-4" />
                      재가입: {rejoinedCount}명
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 실패 통계 */}
            {failedCount > 0 ? (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-700 dark:text-red-300 font-medium">실패</span>
                  <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30">
                    {failedCount}명
                  </Badge>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  일부 연맹원 등록에 실패했습니다
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">선택된 등급</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {selectedGrade}
                  </Badge>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  모든 연맹원이 해당 등급으로 등록되었습니다
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 추가 정보 */}
        {rejoinedCount > 0 && (
          <div className="ai-fade-in bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800" style={{animationDelay: '0.4s'}}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                  재가입한 연맹원이 있습니다! 🎉
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {rejoinedCount}명의 연맹원이 다시 연맹에 복귀했습니다. 탈퇴 상태에서 활성 상태로 자동 변경되었습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 ai-fade-in" style={{animationDelay: '0.6s'}}>
          <Button
            onClick={() => router.push('/users')}
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg ai-hover-scale"
          >
            <Users className="h-5 w-5 mr-2" />
            연맹원 관리 페이지로
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button
            onClick={onStartNew}
            variant="outline"
            size="lg"
            className="flex-1 border-green-300 hover:bg-green-50 hover:border-green-400 dark:border-green-700 dark:hover:bg-green-950/30 ai-hover-scale"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            새로운 등록 시작
          </Button>
        </div>

        {/* 홈으로 가기 */}
        <div className="text-center ai-fade-in" style={{animationDelay: '0.8s'}}>
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4 mr-2" />
            메인 페이지로 돌아가기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}