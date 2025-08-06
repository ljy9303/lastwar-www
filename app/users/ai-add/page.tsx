import { Suspense } from "react"
import { Metadata } from "next"
import { AIUserRegistration } from "./components/AIUserRegistration"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Bot, Sparkles, Shield, Upload, Search, CheckSquare, UserPlus } from "lucide-react"

export const metadata: Metadata = {
  title: "AI 유저 등록 - LastWar",
  description: "스크린샷 이미지를 사용하여 AI로 유저를 자동 등록합니다",
}

function AIUserRegistrationLoading() {
  const stepInfo = [
    { icon: Shield, title: '등급 선택', color: 'text-blue-600' },
    { icon: Upload, title: '이미지 업로드', color: 'text-green-600' },
    { icon: Search, title: 'AI 분석', color: 'text-purple-600' },
    { icon: CheckSquare, title: '정보 검증', color: 'text-orange-600' },
    { icon: UserPlus, title: '등록 완료', color: 'text-emerald-600' }
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 헤더 로딩 애니메이션 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <Skeleton className="h-10 w-32" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Bot className="h-8 w-8 text-blue-600" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
      </motion.div>

      {/* 진행률 스켈레톤 - 더 상세한 애니메이션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </motion.div>
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              
              {/* 진행률 바 */}
              <div className="relative">
                <Skeleton className="h-3 w-full" />
                <motion.div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30"
                  animate={{ width: ['0%', '20%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* 단계 스켈레톤 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stepInfo.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                      className="relative"
                    >
                      <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                        <div className="flex flex-col items-center space-y-2">
                          <motion.div
                            animate={{ 
                              y: [0, -2, 0],
                              rotate: [0, 2, -2, 0]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: index * 0.2 
                            }}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                          >
                            <Icon className={`h-5 w-5 ${step.color}`} />
                          </motion.div>
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-20 hidden lg:block" />
                        </div>
                      </div>
                      
                      {/* 지연 로딩 훨르링 */}
                      <motion.div
                        className="absolute inset-0 rounded-lg border-2 border-blue-300 dark:border-blue-700 opacity-0"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          delay: index * 0.3,
                          ease: "easeInOut" 
                        }}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 메인 컨텐츠 로딩 - 더 생생한 애니메이션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* 제목 영역 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full"
                  >
                    <Shield className="h-6 w-6 text-blue-600" />
                  </motion.div>
                  <Skeleton className="h-8 w-56" />
                </div>
                <div className="space-y-2 ml-12">
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-4 w-80" />
                </div>
              </div>
              
              {/* 컨텐칠 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
                    className="relative"
                  >
                    <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                    
                    {/* 반짝이는 테두리 */}
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-blue-200 dark:border-blue-800 opacity-0"
                      animate={{ opacity: [0, 0.3, 0], scale: [0.98, 1.02, 0.98] }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: i * 0.5,
                        ease: "easeInOut" 
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* 네비게이션 스켈레톤 */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <Skeleton className="h-10 w-28" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* 로딩 지시자 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-center py-8"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Bot className="h-5 w-5 text-blue-600" />
          </motion.div>
          <span className="text-sm font-medium">AI 유저 등록 시스템 초기화 중...</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default function AIUserAddPage() {
  return (
    <Suspense fallback={<AIUserRegistrationLoading />}>
      <AIUserRegistration />
    </Suspense>
  )
}