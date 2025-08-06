import { Suspense } from "react"
import { Metadata } from "next"
import { AIUserRegistration } from "./components/AIUserRegistration"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "AI 유저 등록 - LastWar",
  description: "스크린샷 이미지를 사용하여 AI로 유저를 자동 등록합니다",
}

function AIUserRegistrationLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* 진행률 카드 스켈레톤 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 컨텐츠 스켈레톤 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
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