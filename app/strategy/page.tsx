"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, Users, Lightbulb } from "lucide-react"

export default function StrategyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">공략 공유</h1>
            <p className="text-muted-foreground">
              다양한 공략과 팁을 공유해주세요
            </p>
          </div>
        </div>
      </div>

      {/* 준비중 메시지 카드 */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">오픈 준비중입니다</CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            연맹원들이 서로의 공략과 전략을 공유할 수 있는 게시판을 준비하고 있습니다.
            곧 만나볼 수 있도록 열심히 개발 중이니 조금만 기다려주세요!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">연맹원 소통</h3>
              <p className="text-sm text-muted-foreground">
                연맹원들과 함께 전략을 공유하고 토론할 수 있습니다
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
              <Lightbulb className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">공략 팁 모음</h3>
              <p className="text-sm text-muted-foreground">
                게임 내 다양한 공략과 유용한 팁들을 한곳에서 확인하세요
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">가이드 공유</h3>
              <p className="text-sm text-muted-foreground">
                초보자부터 고수까지, 모든 레벨의 가이드를 공유해보세요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추가 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">앞으로 제공될 기능들</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">전략 게시판</h4>
                <p className="text-sm text-muted-foreground">사막전, 연맹전 등 다양한 콘텐츠별 전략 공유</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">팁 & 노하우</h4>
                <p className="text-sm text-muted-foreground">게임 플레이에 도움이 되는 각종 팁과 노하우</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">질문 & 답변</h4>
                <p className="text-sm text-muted-foreground">궁금한 점을 물어보고 연맹원들이 답변해주는 공간</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">카테고리별 분류</h4>
                <p className="text-sm text-muted-foreground">콘텐츠 유형별로 정리된 체계적인 정보 관리</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}