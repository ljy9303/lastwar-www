import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, Vote, UserSquare, LayoutDashboard, Settings } from "lucide-react"

export default function Home() {
  const features = [
    {
      title: "유저 관리",
      description: "게임 유저 정보를 수동으로 관리하고 히스토리를 확인합니다.",
      icon: Users,
      href: "/users",
    },
    {
      title: "사전 투표 등록",
      description: "유저의 사막전 팀 희망 투표를 수집 및 관리합니다.",
      icon: Vote,
      href: "/votes",
    },
    {
      title: "스쿼드 관리",
      description: "사전 투표 기반으로 스쿼드를 구성하고 확정합니다.",
      icon: UserSquare,
      href: "/squads",
    },
    {
      title: "이벤트 대시보드",
      description: "전체 인원 상태 및 사막전 준비 상황을 요약합니다.",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "설정 및 권한 관리",
      description: "관리자 권한 설정 및 시스템 설정을 관리합니다.",
      icon: Settings,
      href: "/settings",
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">1242 ROKK 이벤트 관리 시스템</h1>
      <p className="text-muted-foreground mb-8">이벤트 매치를 효율적으로 관리하기 위한 시스템입니다.</p>

      {/* 메인 페이지의 카드 그리드를 모바일에 맞게 조정합니다. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <feature.icon className="h-6 w-6 mb-2 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={feature.href}>
                <Button className="w-full">바로가기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
