import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StrategyLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* 메인 카드 스켈레톤 */}
      <Card className="border-dashed border-2">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto mb-1" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                <Skeleton className="h-8 w-8 rounded mb-2" />
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 추가 정보 카드 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}